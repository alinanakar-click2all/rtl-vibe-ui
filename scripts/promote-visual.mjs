#!/usr/bin/env node
/**
 * Stage 60 — promote the already-reviewed chart trial to the official demo.
 * Fail-closed: only accepts the candidate made from the current official HTML.
 * CSS and JS remain separate. Existing markup/styles/handlers are not rewritten.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildVisualTrial } from './build-visual-preview.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const official = join(root, 'demo.html');
const candidate = join(root, 'demo-visual-candidate.html');
const css = join(root, 'assets/demo-visual-preview.css');
const js = join(root, 'assets/demo-visual-preview.js');
const cssRef = '<link rel="stylesheet" href="assets/demo-visual-preview.css" />';
const jsRef = '<script src="assets/demo-visual-preview.js"></script>';
const baseCssRef = '<link rel="stylesheet" href="assets/demo-enhancements.css" />';
const baseJsRef = '<script src="assets/demo-enhancements.js"></script>';

function count(haystack, needle) { return haystack.split(needle).length - 1; }

export function validateVisualOfficial(html) {
  if (!/^\s*<!doctype html>/i.test(html)) throw new Error('Expected HTML doctype.');
  const required = [
    [baseCssRef, 'base CSS'], [cssRef, 'visual CSS'],
    [baseJsRef, 'base JavaScript'], [jsRef, 'visual JavaScript'],
    ['id="panel-overview"', 'overview panel'], ['id="panel-orders"', 'orders panel'],
    ['id="tab-overview"', 'overview tab'],
  ];
  for (const [marker, label] of required) {
    if (count(html, marker) !== 1) throw new Error(`${label} must occur exactly once.`);
  }
  if (html.indexOf(cssRef) < html.indexOf(baseCssRef)) throw new Error('Visual CSS must follow base CSS.');
  if (html.indexOf(jsRef) < html.indexOf(baseJsRef)) throw new Error('Visual JavaScript must follow base JavaScript.');
  if (!(html.indexOf(cssRef) < html.indexOf('</head>'))) throw new Error('Visual CSS must be within head.');
  if (!(html.indexOf(jsRef) < html.indexOf('</body>'))) throw new Error('Visual JS must be within body.');
  return true;
}

/** Compare exactly; a stale candidate cannot overwrite a changed official file. */
export function safePromotion(original, prepared) {
  const expected = buildVisualTrial(original); // rejects duplicate or unexpected source shape
  if (prepared !== expected) throw new Error('Visual candidate is stale or modified; re-run --prepare and re-test it.');
  validateVisualOfficial(prepared);
  return prepared;
}

function run(mode) {
  for (const [file, label] of [[official, 'official demo'], [css, 'visual CSS'], [js, 'visual JavaScript']]) {
    if (!existsSync(file)) throw new Error(`Missing ${label}: ${file}`);
  }
  const original = readFileSync(official, 'utf8');
  if (mode === '--check') {
    validateVisualOfficial(original);
    console.log('Official visual dashboard: valid. Both visualization assets are linked once.');
    return;
  }
  if (mode !== '--apply') throw new Error('Usage: node scripts/promote-visual.mjs --apply | --check');
  if (!existsSync(candidate)) throw new Error('Visual candidate missing; run node scripts/build-visual-preview.mjs --prepare first.');
  const prepared = readFileSync(candidate, 'utf8');
  const next = safePromotion(original, prepared);
  writeFileSync(official, next, 'utf8');
  console.log('Official demo visual upgrade applied: demo.html now includes chart assets.');
  console.log('Rollback before commit: git restore -- demo.html');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3 || !['--apply','--check'].includes(process.argv[2])) {
    console.error('Usage: node scripts/promote-visual.mjs --apply | --check');
    process.exitCode = 2;
  } else {
    try { run(process.argv[2]); }
    catch (err) { console.error(`Visual promotion aborted: ${err.message}`); process.exitCode = 1; }
  }
}
