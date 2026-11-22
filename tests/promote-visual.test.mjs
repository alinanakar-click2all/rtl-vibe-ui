import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { buildVisualTrial } from '../scripts/build-visual-preview.mjs';
import { safePromotion, validateVisualOfficial } from '../scripts/promote-visual.mjs';

const original = `<!DOCTYPE html>\n<html dir="rtl"><head>\n<link rel="stylesheet" href="assets/demo-enhancements.css" />\n</head><body>\n<button id="tab-overview">نمای کلی</button>\n<div id="panel-overview"></div><div id="panel-orders"></div>\n<script src="assets/demo-enhancements.js"></script>\n</body></html>`;

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'rtl-visual-promote-'));
  for (const dirPart of ['scripts','assets']) mkdirSync(join(dir, dirPart));
  for (const file of ['build-visual-preview.mjs','promote-visual.mjs']) {
    copyFileSync(fileURLToPath(new URL(`../scripts/${file}`, import.meta.url)), join(dir, 'scripts', file));
  }
  for (const file of ['demo-visual-preview.css','demo-visual-preview.js']) {
    copyFileSync(fileURLToPath(new URL(`../assets/${file}`, import.meta.url)), join(dir, 'assets', file));
  }
  writeFileSync(join(dir,'demo.html'), original);
  return dir;
}
function cli(dir, arg) {
  return spawnSync(process.execPath, [join(dir,'scripts/promote-visual.mjs'), arg], { encoding:'utf8' });
}

test('promotes exact candidate and preserves unrelated HTML bytes', () => {
  const promoted = safePromotion(original, buildVisualTrial(original));
  assert.equal(validateVisualOfficial(promoted), true);
  assert.ok(promoted.includes('نمای کلی'));
  assert.ok(promoted.includes('<div id="panel-orders"></div>'));
  assert.equal((promoted.match(/demo-visual-preview\.js/g)||[]).length, 1);
});
test('rejects stale candidates, missing panels, and duplicate promotion', () => {
  const next = buildVisualTrial(original);
  assert.throws(() => safePromotion(original, next+'<!-- changed -->'), /stale or modified/);
  assert.throws(() => safePromotion(original.replace('id="panel-overview"','id="unknown"'), next), /overview panel/);
  assert.throws(() => safePromotion(next, next), /already installed/);
});
test('validator rejects missing and duplicate asset links', () => {
  const converted = buildVisualTrial(original);
  assert.throws(() => validateVisualOfficial(original), /visual CSS/);
  assert.throws(() => validateVisualOfficial(converted.replace('assets/demo-visual-preview.js','assets/wrong.js')), /visual JavaScript/);
  assert.throws(() => validateVisualOfficial(converted + '<script src="assets/demo-visual-preview.js"></script>'), /exactly once/);
});
test('Windows CRLF bytes remain unchanged outside two inserted links', () => {
  const win = original.replace(/\n/g, '\r\n');
  const promoted = safePromotion(win, buildVisualTrial(win));
  assert.equal(promoted.replace(/\r\n/g, '\n'), buildVisualTrial(original));
});
test('CLI apply/check works and refuses second apply; originals are not changed before apply', () => {
  const dir = fixture();
  try {
    const originalFile = join(dir,'demo.html');
    const candidate = join(dir,'demo-visual-candidate.html');
    writeFileSync(candidate, buildVisualTrial(original));
    assert.equal(readFileSync(originalFile,'utf8'), original);
    assert.equal(cli(dir,'--check').status, 1);
    const applied = cli(dir,'--apply');
    assert.equal(applied.status, 0, applied.stderr);
    assert.equal(validateVisualOfficial(readFileSync(originalFile,'utf8')), true);
    assert.equal(cli(dir,'--check').status, 0);
    assert.notEqual(cli(dir,'--apply').status, 0);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});
test('CLI refuses stale candidate without touching original', () => {
  const dir = fixture();
  try {
    writeFileSync(join(dir,'demo-visual-candidate.html'), buildVisualTrial(original)+'\n');
    const result=cli(dir,'--apply');
    assert.notEqual(result.status, 0);
    assert.equal(readFileSync(join(dir,'demo.html'),'utf8'), original);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});
