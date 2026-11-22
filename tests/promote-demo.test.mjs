import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promoteLegacyHtml, validateOfficialHtml } from '../scripts/promote-demo.mjs';

const css = readFileSync(new URL('../assets/demo-enhancements.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('../assets/demo-enhancements.js', import.meta.url), 'utf8');
const legacy = `<!DOCTYPE html><html dir="rtl" lang="fa"><head></head><body>
<div class="app"><aside class="sidebar"></aside><main class="main"><header class="topbar">\n      <label class="search"></label></header></main></div>
<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title"></aside>
<p class="field-error">شماره باید ۱۱ رقم باشد.</p>
<script>/* Modal */ const legacyHandler=1; /* Toast */ const otherHandler=1;</script></body></html>`;

function tempProject() {
  const dir = mkdtempSync(join(tmpdir(), 'rtl-vibe-promotion-'));
  mkdirSync(join(dir, 'scripts'));
  mkdirSync(join(dir, 'assets'));
  for (const file of ['build-demo-preview.mjs', 'promote-demo.mjs']) {
    copyFileSync(fileURLToPath(new URL(`../scripts/${file}`, import.meta.url)), join(dir, 'scripts', file));
  }
  for (const file of ['demo-enhancements.css', 'demo-enhancements.js']) {
    copyFileSync(fileURLToPath(new URL(`../assets/${file}`, import.meta.url)), join(dir, 'assets', file));
  }
  writeFileSync(join(dir, 'demo.html'), legacy);
  return dir;
}
function cli(dir, flag) {
  return spawnSync(process.execPath, [join(dir, 'scripts/promote-demo.mjs'), flag], { encoding: 'utf8' });
}

test('promotes legacy markup while keeping colors and all unrelated code', () => {
  const converted = promoteLegacyHtml(legacy, css, js);
  assert.equal(validateOfficialHtml(converted), true);
  assert.match(converted, /const otherHandler=1/);
  assert.doesNotMatch(converted, /const legacyHandler=1/);
  assert.doesNotMatch(converted, /--ui-focus: var\(--primary\)/);
  assert.doesNotMatch(converted, /roving tabindex/);
  assert.match(converted, /href="assets\/demo-enhancements.css"/);
  assert.match(converted, /src="assets\/demo-enhancements.js"/);
});

test('refuses to promote a demo whose markup has changed unexpectedly', () => {
  assert.throws(() => promoteLegacyHtml(legacy.replace('/* Modal */', '/* changed */'), css, js), /Cannot locate/);
  assert.throws(() => promoteLegacyHtml(legacy.replace('<aside class="sidebar">','<aside class="navigation">'), css, js), /sidebar/);
});

test('rejects legacy, duplicate and incomplete official demos', () => {
  assert.throws(() => validateOfficialHtml(legacy), /missing/);
  const converted = promoteLegacyHtml(legacy, css, js);
  assert.throws(() => validateOfficialHtml(converted.replace('id="phone-hint"', 'id="missing-hint"')), /phone-hint/);
  assert.throws(() => validateOfficialHtml(converted + '<link rel="stylesheet" href="assets/demo-enhancements.css" />'), /occur once/);
});

test('prepare writes only a candidate; apply promotes it; check verifies official demo', () => {
  const dir = tempProject();
  try {
    let result = cli(dir, '--prepare');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(join(dir, 'demo.html'),'utf8'), legacy);
    assert.equal(existsSync(join(dir, 'demo-official-candidate.html')), true);
    result = cli(dir, '--apply');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(validateOfficialHtml(readFileSync(join(dir, 'demo.html'), 'utf8')), true);
    result = cli(dir, '--check');
    assert.equal(result.status, 0, result.stderr);
    result = cli(dir, '--apply');
    assert.notEqual(result.status, 0, 'Second apply must not silently rewrite official demo');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('apply refuses a stale candidate without changing original demo', () => {
  const dir = tempProject();
  try {
    assert.equal(cli(dir, '--prepare').status, 0);
    writeFileSync(join(dir, 'demo-official-candidate.html'), 'stale output');
    const result = cli(dir, '--apply');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Candidate absent or stale/);
    assert.equal(readFileSync(join(dir, 'demo.html'), 'utf8'), legacy);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('check refuses legacy HTML and never modifies it', () => {
  const dir = tempProject();
  try {
    const result = cli(dir, '--check');
    assert.notEqual(result.status, 0);
    assert.equal(readFileSync(join(dir, 'demo.html'), 'utf8'), legacy);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
