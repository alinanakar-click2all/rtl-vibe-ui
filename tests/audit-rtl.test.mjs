import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const SCRIPT = resolve(import.meta.dirname ?? new URL('.', import.meta.url).pathname, '../scripts/audit-rtl.mjs');

function fixture(t) {
  const base = mkdtempSync(join(tmpdir(), 'rtl-vibe-audit-'));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  return { base, file: (name, text) => {
    const path = join(base, name);
    writeFileSync(path, text, 'utf8');
    return path;
  } };
}

function exec(...args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
}

test('reports error and exits 1 for a Persian root without dir', (t) => {
  const f = fixture(t).file('index.html', '<!doctype html>\n<html lang="fa"><body>سلام</body></html>');
  const result = exec(f, '--check', '--json');
  assert.equal(result.status, 1, result.stderr);
  const data = JSON.parse(result.stdout);
  assert.equal(data.errors, 1);
  assert.equal(data.findings[0].rule, 'html-missing-dir');
  assert.equal(data.findings[0].line, 2);
  assert.equal(readFileSync(f, 'utf8').includes('dir="rtl"'), false);
});

test('--fix changes only root direction, re-audits, and is idempotent', (t) => {
  const f = fixture(t).file('index.html', '<html lang="ar"><body><input type="email"></body></html>');
  const first = exec(f, '--fix', '--json');
  assert.equal(first.status, 0, first.stderr);
  const parsed = JSON.parse(first.stdout);
  assert.equal(parsed.changedFiles, 1);
  assert.equal(parsed.errors, 0);
  assert.equal(parsed.warnings, 1); // email direction merits manual review
  assert.match(readFileSync(f, 'utf8'), /lang="ar" dir="rtl"/);
  assert.doesNotMatch(readFileSync(f, 'utf8'), /input[^>]+dir=/);
  const second = exec(f, '--fix', '--json');
  assert.equal(second.status, 0, second.stderr);
  assert.equal(JSON.parse(second.stdout).changedFiles, 0);
});

test('does not impose RTL on an English page', (t) => {
  const f = fixture(t).file('english.html', '<html lang="en"><body>Hello</body></html>');
  const res = exec(f, '--fix', '--json');
  assert.equal(res.status, 0);
  assert.equal(JSON.parse(res.stdout).changedFiles, 0);
  assert.doesNotMatch(readFileSync(f, 'utf8'), /dir="rtl"/);
});

test('physical CSS is advisory, does not treat dimensions as RTL errors', (t) => {
  const f = fixture(t).file('app.css', '.box { width: 8px; height: 20px; margin-left: 12px; }');
  const res = exec(f, '--check', '--json');
  assert.equal(res.status, 0);
  const obj = JSON.parse(res.stdout);
  assert.equal(obj.errors, 0);
  assert.equal(obj.warnings, 1);
  assert.equal(obj.findings[0].rule, 'css-physical-property');
});

test('--strict exits 1 for warnings', (t) => {
  const f = fixture(t).file('app.css', '.box { margin-right: 12px; }');
  const res = exec(f, '--strict');
  assert.equal(res.status, 1);
});

test('symmetry is determined within one CSS rule, not file-wide', (t) => {
  const f = fixture(t).file('app.css', '.one{left:0;right:0}.two{left:0}');
  const parsed = JSON.parse(exec(f, '--json').stdout);
  assert.equal(parsed.warnings, 1);
  assert.equal(parsed.findings[0].line, 1);
});

test('ignores CSS comments and quoted declaration-like strings', (t) => {
  const f = fixture(t).file('app.css', '/* .not { left: 0 } */\n.a{content:"left: 0;";padding-inline-start:2px}');
  const parsed = JSON.parse(exec(f, '--json').stdout);
  assert.equal(parsed.warnings, 0);
});

test('reports only classes in static markup attributes; correct logical corners', (t) => {
  const f = fixture(t).file('view.tsx', 'const s = "ml-4";\nexport const V=()=><div className="rounded-tl-lg rtl:mr-2 hover:pl-2"/>;');
  const parsed = JSON.parse(exec(f, '--json').stdout);
  assert.equal(parsed.warnings, 2, JSON.stringify(parsed.findings));
  assert.ok(parsed.findings.some((f) => f.message.includes('rounded-ss-lg')));
  assert.ok(parsed.findings.some((f) => f.message.includes('hover:ps-2')));
  assert.ok(!parsed.findings.some((f) => f.message.includes('rtl:mr-2')));
});

test('CSS nested in style element is inspected with correct HTML location', (t) => {
  const f = fixture(t).file('index.html', '<html lang="fa" dir="rtl">\n<style>\n.card { padding-left: 10px; }\n</style>\n</html>');
  const parsed = JSON.parse(exec(f, '--json').stdout);
  assert.equal(parsed.warnings, 1);
  assert.equal(parsed.findings[0].line, 3);
});

test('skips generated folders', (t) => {
  const { base, file } = fixture(t);
  file('index.html', '<html lang="fa" dir="rtl"></html>');
  mkdirSync(join(base, 'node_modules'));
  writeFileSync(join(base, 'node_modules', 'bad.html'), '<html lang="fa">');
  const res = exec(base, '--json');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(JSON.parse(res.stdout).scanned, 1);
});

test('skips symlinks when the OS permits their creation', (t) => {
  const { base, file } = fixture(t);
  const target = file('index.html', '<html lang="fa" dir="rtl"></html>');
  try {
    symlinkSync(target, join(base, 'sym.html'), 'file');
  } catch (error) {
    if (process.platform === 'win32' && ['EPERM', 'EACCES', 'ENOTSUP'].includes(error?.code)) {
      t.skip(`Windows denied symlink creation (${error.code}); generated-folder test still runs separately`);
      return;
    }
    throw error;
  }
  const res = exec(base, '--json');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(JSON.parse(res.stdout).scanned, 1);
});

test('conflicting flags and missing roots fail with status 2', (t) => {
  const f = fixture(t).file('index.html', '<html lang="fa"></html>');
  assert.equal(exec(f, '--fix', '--check').status, 2);
  assert.equal(exec(`${f}.missing`, '--check').status, 2);
});

test('automatic fix never rewrites CSS and Tailwind classes', (t) => {
  const { file } = fixture(t);
  const css = '.x{margin-left:6px;}' ;
  const jsx = '<div className="ml-4"/>';
  const cssFile = file('style.css', css);
  const jsxFile = file('view.jsx', jsx);
  const res = exec(cssFile, jsxFile, '--fix', '--json');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(JSON.parse(res.stdout).changedFiles, 0);
  assert.equal(readFileSync(cssFile, 'utf8'), css);
  assert.equal(readFileSync(jsxFile, 'utf8'), jsx);
});

test('does not warn about an LTR email input or a data-class attribute', (t) => {
  const f = fixture(t).file('page.html', '<html lang="en"><input type="email"><div data-class="ml-4"></div></html>');
  const res = exec(f, '--json');
  assert.equal(res.status, 0);
  assert.equal(JSON.parse(res.stdout).warnings, 0);
});

test('ignores example markup within script and JSX block comments', (t) => {
  const { file } = fixture(t);
  const html = file('page.html', '<html lang="fa" dir="rtl"><script>const x = `<div class="ml-4">`;</script></html>');
  const jsx = file('view.jsx', '/* <div className="ml-3"/> */\nexport const V = () => <div className="ms-3"/>;');
  const res = exec(html, jsx, '--json');
  assert.equal(res.status, 0);
  assert.equal(JSON.parse(res.stdout).warnings, 0);
});
