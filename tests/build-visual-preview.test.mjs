import test from 'node:test';
import assert from 'node:assert/strict';
import { buildVisualTrial } from '../scripts/build-visual-preview.mjs';

const original = `<!DOCTYPE html>\n<html dir="rtl" lang="fa"><head>
<link rel="stylesheet" href="assets/demo-enhancements.css" />
</head><body>
<button id="tab-overview">نمای کلی</button>
<div id="panel-overview"></div><div id="panel-orders"></div>
<script src="assets/demo-enhancements.js"></script>
</body></html>`;

test('adds exactly two assets without changing the original', () => {
  const result = buildVisualTrial(original);
  assert.equal(result.split('assets/demo-visual-preview.css').length - 1, 1);
  assert.equal(result.split('assets/demo-visual-preview.js').length - 1, 1);
  assert.equal(result.split('assets/demo-enhancements.css').length - 1, 1);
  assert.equal(result.split('assets/demo-enhancements.js').length - 1, 1);
  assert.ok(original.includes('</body></html>'));
  assert.equal(result.replace(/  <!-- Stage 57 visual trial: stylesheet -->\n  <link rel="stylesheet" href="assets\/demo-visual-preview\.css" \/>\n/, '').replace(/  <!-- Stage 57 visual trial: behavior -->\n  <script src="assets\/demo-visual-preview\.js"><\/script>\n/, ''), original);
});

test('refuses duplicate trial, missing panel, and missing official assets', () => {
  const result = buildVisualTrial(original);
  assert.throws(() => buildVisualTrial(result), /already installed/);
  assert.throws(() => buildVisualTrial(original.replace('id="panel-overview"', 'id="something-else"')), /overview panel/);
  assert.throws(() => buildVisualTrial(original.replace('assets\/demo-enhancements.css', 'assets\/wrong.css')), /official enhancement CSS/);
});

test('refuses duplicate overview, abnormal head, and non-HTML', () => {
  assert.throws(() => buildVisualTrial(original.replace('</body>', '<div id="panel-overview"></div></body>')), /overview panel/);
  assert.throws(() => buildVisualTrial(original.replace('</head>', '</head></head>')), /document structure/);
  assert.throws(() => buildVisualTrial(original.replace('<!DOCTYPE html>', 'not html')), /Not an HTML/);
});

test('preserves Windows CRLF', () => {
  const originalWindows = original.replace(/\n/g, '\r\n');
  const result = buildVisualTrial(originalWindows);
  assert.equal(result.replace(/\r\n/g, '\n'), buildVisualTrial(original));
});
