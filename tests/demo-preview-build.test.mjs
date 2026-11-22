import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPreview } from '../scripts/build-demo-preview.mjs';
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const css = readFileSync(new URL('../assets/demo-enhancements.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('../assets/demo-enhancements.js', import.meta.url), 'utf8');
const fixture = `<!DOCTYPE html><html dir="rtl" lang="fa"><head></head><body>
<div class="app"><aside class="sidebar"></aside><main class="main"><header class="topbar">\n      <label class="search"></label></header></main></div>
<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title"></aside>
<p class="field-error">شماره باید ۱۱ رقم باشد.</p>
<script>/* Modal */ const old=1; /* Toast */ const existing=1;</script></body></html>`;

test('creates preview without overwriting the original source content', () => {
  const old = fixture;
  const result = buildPreview(old, css, js);
  assert.equal(fixture, old);
  assert.match(result, /id="mobile-nav-toggle"/);
  assert.match(result, /id="mobile-sidebar"/);
  assert.match(result, /id="phone-hint"/);
  assert.match(result, /<style>[\s\S]*--ui-focus/);
});
test('replaces legacy handlers and preserves unrelated scripts', () => {
  const result = buildPreview(fixture, css, js);
  assert.doesNotMatch(result, /const old=1/);
  assert.match(result, /const existing=1/);
  assert.match(result, /roving tabindex/);
  assert.match(result, /const \$\$ =/); // Replacement must preserve literal $$ helper
});
test('preview contains direction-aware tabs, focus trapping and responsive menu', () => {
  const result = buildPreview(fixture, css, js);
  assert.match(result, /rtl \? -1 : 1/);
  assert.match(result, /event\.key !== 'Tab'/);
  assert.match(result, /mobile-nav-open/);
});
test('refuses already-enhanced input', () => {
  assert.throws(() => buildPreview(buildPreview(fixture,css,js),css,js), /already enhanced/);
});
test('fails closed when source shape differs', () => {
  assert.throws(() => buildPreview(fixture.replace('/* Modal */', '/* MODAL */'), css, js), /Cannot locate/);
  assert.throws(() => buildPreview(fixture.replace('<aside class="sidebar">','<aside class="nav">'), css, js), /sidebar/);
});
test('CSS and enhancement JavaScript contain no raw closing script/style tags', () => {
  assert.doesNotMatch(js, /<\/script\s*>/i);
  assert.doesNotMatch(css, /<\/style\s*>/i);
});

// Matches demo.html on the actual GitHub branch (six spaces before search).
test('accepts real demo topbar indentation without altering surrounding markup', () => {
  const result = buildPreview(fixture, css, js);
  assert.match(result, /<header class="topbar">\n      <button[^>]+id="mobile-nav-toggle"[^>]*>☰<\/button>\n      <label class="search">/);
  assert.match(result, /<label class="search"><\/label><\/header>/);
});
test('supports CRLF input without changing the topbar line-ending style', () => {
  const windowsFixture = fixture.replace(/\n/g, '\r\n');
  const result = buildPreview(windowsFixture, css, js);
  assert.match(result, /<header class="topbar">\r\n      <button[^>]+id="mobile-nav-toggle"[^>]*>☰<\/button>\r\n      <label class="search">/);
});
test('fails closed when topbar search relationship is missing or duplicated', () => {
  assert.throws(() => buildPreview(fixture.replace('<label class="search">','<div class="search">'),css,js), /topbar: expected exactly one match, got 0/);
  const duplicate = fixture.replace('</header>', '</header><header class="topbar">\n      <label class="search"></label></header>');
  assert.throws(() => buildPreview(duplicate,css,js), /topbar: expected exactly one match, got 2/);
});

test('CLI creates an independent preview and leaves source bytes untouched', () => {
  const sandbox = mkdtempSync(join(tmpdir(), 'rtl-vibe-preview-'));
  try {
    mkdirSync(join(sandbox, 'scripts'));
    mkdirSync(join(sandbox, 'assets'));
    const script = fileURLToPath(new URL('../scripts/build-demo-preview.mjs', import.meta.url));
    copyFileSync(script, join(sandbox, 'scripts/build-demo-preview.mjs'));
    copyFileSync(fileURLToPath(new URL('../assets/demo-enhancements.css', import.meta.url)), join(sandbox, 'assets/demo-enhancements.css'));
    copyFileSync(fileURLToPath(new URL('../assets/demo-enhancements.js', import.meta.url)), join(sandbox, 'assets/demo-enhancements.js'));
    writeFileSync(join(sandbox, 'demo.html'), fixture, 'utf8');
    const result = spawnSync(process.execPath, [join(sandbox, 'scripts/build-demo-preview.mjs')], {encoding:'utf8'});
    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(join(sandbox, 'demo-upgraded-preview.html')), true);
    assert.equal(readFileSync(join(sandbox, 'demo.html'), 'utf8'), fixture);
    assert.match(readFileSync(join(sandbox, 'demo-upgraded-preview.html'), 'utf8'), /id="mobile-nav-toggle"/);
  } finally {
    rmSync(sandbox, {recursive:true, force:true});
  }
});
