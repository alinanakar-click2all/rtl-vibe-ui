#!/usr/bin/env node
/**
 * Stage 57: fail-closed, non-destructive visual trial builder.
 * Reads the already-promoted official demo, adds two separate assets to a candidate.
 * It NEVER edits demo.html, current shared assets, or browser test config.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const officialPath = join(rootDir, 'demo.html');
const trialPath = join(rootDir, 'demo-visual-candidate.html');
const cssPath = join(rootDir, 'assets/demo-visual-preview.css');
const jsPath = join(rootDir, 'assets/demo-visual-preview.js');
const cssRef = '<link rel="stylesheet" href="assets/demo-visual-preview.css" />';
const jsRef = '<script src="assets/demo-visual-preview.js"></script>';

function once(source, marker, label) {
  const count = source.split(marker).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one occurrence; found ${count}. No files changed.`);
}

export function buildVisualTrial(html) {
  const required = [
    ['<link rel="stylesheet" href="assets/demo-enhancements.css" />', 'official enhancement CSS'],
    ['<script src="assets/demo-enhancements.js"></script>', 'official enhancement JS'],
    ['id="panel-overview"', 'overview panel'],
    ['id="tab-overview"', 'overview tab'],
    ['id="panel-orders"', 'orders tab panel'],
  ];
  if (!html.trimStart().startsWith('<!DOCTYPE html>')) throw new Error('Not an HTML document. No files changed.');
  for (const [marker, name] of required) once(html, marker, name);
  if (html.includes('assets/demo-visual-preview.css') || html.includes('assets/demo-visual-preview.js')) {
    throw new Error('Visual trial is already installed. No files changed.');
  }
  if ((html.match(/<\/head\s*>/gi) || []).length !== 1 || (html.match(/<\/body\s*>/gi) || []).length !== 1) {
    throw new Error('Unexpected document structure. No files changed.');
  }
  const newline = html.includes('\r\n') ? '\r\n' : '\n';
  return html
    .replace(/<\/head\s*>/i, match => `  <!-- Stage 57 visual trial: stylesheet -->${newline}  ${cssRef}${newline}${match}`)
    .replace(/<\/body\s*>/i, match => `  <!-- Stage 57 visual trial: behavior -->${newline}  ${jsRef}${newline}${match}`);
}

function run(mode) {
  for (const path of [officialPath, cssPath, jsPath]) {
    if (!existsSync(path)) throw new Error(`Missing required file: ${path}`);
  }
  const original = readFileSync(officialPath, 'utf8');
  const expected = buildVisualTrial(original);
  if (mode === '--prepare') {
    writeFileSync(trialPath, expected, 'utf8');
    console.log(`Visual trial created: ${trialPath}`);
    console.log('Original demo.html and enhancement assets: untouched.');
    return;
  }
  if (!existsSync(trialPath) || readFileSync(trialPath, 'utf8') !== expected) {
    throw new Error('Trial is absent or stale. Re-run --prepare; official demo is untouched.');
  }
  console.log('Visual trial: matches the current official demo with only two asset links added.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  if (!['--prepare', '--check'].includes(mode) || process.argv.length !== 3) {
    console.error('Usage: node scripts/build-visual-preview.mjs --prepare | --check');
    process.exitCode = 2;
  } else {
    try { run(mode); }
    catch (error) { console.error(`Visual trial aborted: ${error.message}`); process.exitCode = 1; }
  }
}
