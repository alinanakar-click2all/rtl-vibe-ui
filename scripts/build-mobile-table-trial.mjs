/**
 * Stage 63: prepare/check an *ignored* mobile-table trial without editing demo.html.
 * The candidate is in browser-check/artifacts, already ignored by Git.
 * Its <base> points two levels up so existing asset links load from project root.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(root, 'demo.html');
const outDir = join(root, 'browser-check', 'artifacts');
const outPath = join(outDir, 'demo-mobile-table-candidate.html');

function replaceExactlyOnce(input, needle, replacement, label) {
  const first = input.indexOf(needle);
  if (first === -1 || input.indexOf(needle, first + needle.length) !== -1) {
    throw new Error(`${label}: expected exactly one anchor; source is not in the expected shape.`);
  }
  return input.slice(0, first) + replacement + input.slice(first + needle.length);
}

export function buildTrial(html) {
  const eol = html.includes('\r\n') ? '\r\n' : '\n';
  if (!/^\s*<!doctype html>/i.test(html)) throw new Error('Expected complete HTML document.');
  if (html.includes('orders-scroll-hint') || html.includes('demo-mobile-table-trial.css')) {
    throw new Error('Mobile table trial already present; refusing duplication.');
  }
  for (const marker of [
    'assets/demo-enhancements.css',
    'assets/demo-enhancements.js',
    'assets/demo-visual-preview.css',
    'assets/demo-visual-preview.js',
    '<section class="grid-2">',
  ]) if (!html.includes(marker)) throw new Error(`Missing official demo marker: ${marker}`);

  // The production heading uses a Persian zero-width non-joiner (سفارش‌ها).
  // Some legacy fixtures omit it (سفارشها). Require one *semantic* heading,
  // not one particular byte sequence; otherwise preserve fail-closed behavior.
  const headingPattern = /<h2(?:\s+[^<>]*)?>\s*آخرین\s+سفارش[\s\u200c]*ها\s*<\/h2>/gu;
  const headings = [...html.matchAll(headingPattern)];
  if (headings.length !== 1) {
    throw new Error(`Orders table heading: expected exactly one matching heading; got ${headings.length}.`);
  }
  const gridAt = html.indexOf('<section class="grid-2">');
  const tableAt = html.indexOf('<div class="table-wrap">');
  if (!(gridAt < headings[0].index && headings[0].index < tableAt)) {
    throw new Error('Orders table: heading, grid and table wrapper are not in the expected order.');
  }
  // This is for the nested candidate file, not for production demo.html.
  let result = replaceExactlyOnce(html, '<head>', [
    '<head>',
    '<!-- Stage 63 trial: resolve existing project assets from the ignored nested candidate. -->',
    '<base href="../../">',
    '<link rel="stylesheet" href="assets/demo-mobile-table-trial.css">',
  ].join(eol), 'head');

  // The *unique* order table retains its original table/thead/tbody/td semantics.
  result = replaceExactlyOnce(result, '<div class="table-wrap">', [
    '<p class="orders-scroll-hint" id="orders-scroll-hint">برای مشاهده همه ستون‌ها، جدول را به چپ و راست پیمایش کنید.</p>',
    '<div class="table-wrap" role="region" aria-label="جدول آخرین سفارش‌ها" aria-describedby="orders-scroll-hint" tabindex="0">',
  ].join(eol), 'orders table wrapper');
  return result;
}

export function checkTrial(source, candidate) {
  if (candidate !== buildTrial(source)) throw new Error('Candidate is missing, stale or modified.');
}

function main() {
  const arg = process.argv[2];
  if (arg !== '--prepare' && arg !== '--check') {
    throw new Error('Usage: node scripts/build-mobile-table-trial.mjs --prepare|--check');
  }
  const html = readFileSync(sourcePath, 'utf8');
  const trial = buildTrial(html);
  if (arg === '--prepare') {
    if (!existsSync(join(root, 'assets', 'demo-mobile-table-trial.css'))) {
      throw new Error('Missing assets/demo-mobile-table-trial.css. Extract patch preserving folders.');
    }
    mkdirSync(outDir, { recursive: true });
    writeFileSync(outPath, trial, 'utf8');
    console.log(`Trial created: ${outPath}`);
    console.log('Official demo.html was not modified. Candidate stays inside ignored browser-check/artifacts.');
  } else {
    checkTrial(html, readFileSync(outPath, 'utf8'));
    console.log('Trial is current, exact, and separate from the official demo.');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
