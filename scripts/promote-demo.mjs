#!/usr/bin/env node
/**
 * One-time, fail-closed promotion of the tested preview to the official demo.
 *
 * --prepare: create demo-official-candidate.html, NEVER touch demo.html.
 * --apply:   replace demo.html only when it still matches the original and the
 *            candidate exactly matches the promotion calculated from current assets.
 * --check:   validate the already promoted demo.html (used by CI).
 *
 * Git history preserves the original demo.html. No generated candidate is tracked.
 */
import { readFileSync, writeFileSync, existsSync, renameSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPreview } from './build-demo-preview.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(root, 'demo.html');
const candidatePath = join(root, 'demo-official-candidate.html');
const cssPath = join(root, 'assets/demo-enhancements.css');
const jsPath = join(root, 'assets/demo-enhancements.js');
const officialMarker = '<!-- RTL Vibe UI — official enhanced demo -->';
const previewMarker = 'RTL Vibe UI — Demo enhancement preview';
const cssReference = '<link rel="stylesheet" href="assets/demo-enhancements.css" />';
const jsReference = '<script src="assets/demo-enhancements.js"></script>';

function replaceOne(source, from, to, label) {
  const occurrences = source.split(from).length - 1;
  if (occurrences !== 1) {
    throw new Error(`${label}: expected one exact match; found ${occurrences}. No file was changed.`);
  }
  return source.replace(from, () => to);
}

export function promoteLegacyHtml(originalHtml, enhancementCss, enhancementJs) {
  // The existing, previously tested builder remains the source of truth for
  // converting legacy handlers and adding mobile navigation/ARIA attributes.
  let official = buildPreview(originalHtml, enhancementCss, enhancementJs);
  official = replaceOne(
    official,
    `<!-- ${previewMarker}: CSS -->\n<style>\n${enhancementCss}\n</style>`,
    `${officialMarker}\n${cssReference}`,
    'External stylesheet',
  );
  official = replaceOne(
    official,
    `<!-- ${previewMarker}: JS -->\n<script>\n${enhancementJs}\n</script>`,
    jsReference,
    'External interaction script',
  );
  official = replaceOne(
    official,
    '/* Modal, Drawer, Tabs, Accordion: handled by preview enhancement script. */',
    '/* Modal, Drawer, Tabs, Accordion: handled by assets/demo-enhancements.js. */',
    'Legacy handler replacement comment',
  );
  validateOfficialHtml(official);
  return official;
}

export function validateOfficialHtml(html) {
  const required = [
    officialMarker,
    cssReference,
    jsReference,
    'id="mobile-nav-toggle"',
    'id="mobile-sidebar"',
    'id="mobile-nav-backdrop"',
    'id="phone-hint"',
    'id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" aria-hidden="true" inert',
    '/* Modal, Drawer, Tabs, Accordion: handled by assets/demo-enhancements.js. */',
  ];
  for (const fragment of required) {
    if (!html.includes(fragment)) throw new Error(`Official demo validation failed: missing ${fragment}`);
  }
  if (!html.startsWith('<!DOCTYPE html>') || !html.includes('<html dir="rtl" lang="fa"')) {
    throw new Error('Official demo validation failed: unexpected document root.');
  }
  if (html.includes(`<!-- ${previewMarker}: CSS -->`) || html.includes(`<!-- ${previewMarker}: JS -->`)) {
    throw new Error('Official demo validation failed: preview assets are still inlined.');
  }
  if (html.includes('/* Modal */')) throw new Error('Official demo validation failed: legacy event handlers remain.');
  if (html.split(cssReference).length !== 2 || html.split(jsReference).length !== 2) {
    throw new Error('Official demo validation failed: asset references must each occur once.');
  }
  return true;
}

function run(mode) {
  if (!existsSync(sourcePath) || !existsSync(cssPath) || !existsSync(jsPath)) {
    throw new Error('Missing demo.html or enhancement assets. Run this script from a complete repository checkout.');
  }
  const original = readFileSync(sourcePath, 'utf8');
  if (mode === '--check') {
    validateOfficialHtml(original);
    console.log('Official demo structure: valid. External CSS and JavaScript references are present.');
    return;
  }
  const css = readFileSync(cssPath, 'utf8');
  const js = readFileSync(jsPath, 'utf8');
  const expected = promoteLegacyHtml(original, css, js);
  if (mode === '--prepare') {
    writeFileSync(candidatePath, expected, 'utf8');
    console.log(`Candidate created: ${candidatePath}`);
    console.log('Original demo.html: untouched. Test candidate in Chrome before --apply.');
    return;
  }
  if (!existsSync(candidatePath) || readFileSync(candidatePath, 'utf8') !== expected) {
    throw new Error('Candidate absent or stale. Run --prepare and validate candidate before --apply. Original demo.html was not changed.');
  }
  // Atomic replacement in the same directory. A failed write/rename leaves the
  // original tracked file available and the temporary file cleaned up.
  const tmpPath = `${sourcePath}.promotion-tmp`;
  try {
    writeFileSync(tmpPath, expected, { encoding: 'utf8', flag: 'wx' });
    renameSync(tmpPath, sourcePath);
  } finally {
    if (existsSync(tmpPath)) rmSync(tmpPath);
  }
  console.log('Official demo promoted: demo.html now references external enhancement assets.');
  console.log('Rollback before commit: git restore -- demo.html');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  if (!['--prepare', '--apply', '--check'].includes(mode) || process.argv.length !== 3) {
    console.error('Usage: node scripts/promote-demo.mjs --prepare | --apply | --check');
    process.exitCode = 2;
  } else {
    try { run(mode); }
    catch (error) { console.error(`Demo promotion aborted: ${error.message}`); process.exitCode = 1; }
  }
}
