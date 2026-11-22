#!/usr/bin/env node
/**
 * Stage 66 — safely promote the approved mobile orders-table trial.
 * The existing table stays native; no rows, headings, scripts or legacy CSS
 * are rewritten. Apply requires a byte-for-byte current trial candidate.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTrial, checkTrial } from './build-mobile-table-trial.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const officialPath = join(root, 'demo.html');
const candidatePath = join(root, 'browser-check/artifacts/demo-mobile-table-candidate.html');
const stylesheetPath = join(root, 'assets/demo-mobile-table-trial.css');
const cssReference = '<link rel="stylesheet" href="assets/demo-mobile-table-trial.css">';
const headingAnchor = '<!-- Stage 63 trial: resolve existing project assets from the ignored nested candidate. -->';
const trialBase = '<base href="../../">';
const officialAnchor = '<!-- Stage 66: approved responsive orders-table enhancement. -->';

function count(text, marker) { return text.split(marker).length - 1; }

/**
 * Count real asset elements, not incidental filename mentions in inline scripts
 * or comments. The production demo has an inline comment naming
 * assets/demo-enhancements.js in addition to its single real script element.
 * A raw substring count incorrectly rejected that valid document.
 */
function countAssetElements(html, tag, attribute, expectedPath) {
  const markup = html.replace(/<!--[\s\S]*?-->/g, '');
  const tagPattern = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
  const attributePattern = new RegExp(`\\b${attribute}\\s*=\\s*(["'])(.*?)\\1`, 'i');
  let countMatches = 0;
  for (const match of markup.matchAll(tagPattern)) {
    const found = match[0].match(attributePattern);
    if (found?.[2] === expectedPath) countMatches++;
  }
  return countMatches;
}

export function validateMobileTableOfficial(html) {
  if (!/^\s*<!doctype html>/i.test(html)) throw new Error('Expected complete official HTML.');
  if (count(html, 'assets/demo-mobile-table-trial.css') !== 1 || count(html, cssReference) !== 1) {
    throw new Error('Official orders-table stylesheet must appear exactly once.');
  }
  if (count(html, officialAnchor) !== 1) throw new Error('Official mobile-table anchor must appear exactly once.');
  if (html.includes(headingAnchor) || /<base\s+href=["']\.\.\/\.\.\/["']\s*\/?>/i.test(html)) {
    throw new Error('Nested preview base or trial-only head marker leaked into the official demo.');
  }
  const headStart = html.indexOf('<head>'), headEnd = html.indexOf('</head>');
  if (!(headStart >= 0 && headStart < html.indexOf(cssReference) && html.indexOf(cssReference) < headEnd)) {
    throw new Error('Orders-table CSS link must be inside the document head.');
  }
  const hint = '<p class="orders-scroll-hint" id="orders-scroll-hint">برای مشاهده همه ستون‌ها، جدول را به چپ و راست پیمایش کنید.</p>';
  const region = '<div class="table-wrap" role="region" aria-label="جدول آخرین سفارش‌ها" aria-describedby="orders-scroll-hint" tabindex="0">';
  if (count(html, hint) !== 1 || count(html, region) !== 1 || count(html, 'id="orders-scroll-hint"') !== 1) {
    throw new Error('Mobile table hint and accessible scroll region must appear exactly once.');
  }
  const gridAt = html.indexOf('<section class="grid-2">');
  const hintAt = html.indexOf(hint), regionAt = html.indexOf(region);
  if (!(gridAt >= 0 && gridAt < hintAt && hintAt < regionAt)) {
    throw new Error('Orders-table hint/region are not in expected document order.');
  }
  for (const marker of ['assets/demo-enhancements.css', 'assets/demo-visual-preview.css']) {
    if (countAssetElements(html, 'link', 'href', marker) !== 1) {
      throw new Error(`Required official asset missing or duplicated: ${marker}`);
    }
  }
  for (const marker of ['assets/demo-enhancements.js', 'assets/demo-visual-preview.js']) {
    if (countAssetElements(html, 'script', 'src', marker) !== 1) {
      throw new Error(`Required official asset missing or duplicated: ${marker}`);
    }
  }
  return true;
}

export function safeMobileTablePromotion(original, prepared) {
  // Reject already-promoted, stale, missing-heading and double-anchor inputs.
  checkTrial(original, prepared);
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  const trialHeader = ['<head>', headingAnchor, trialBase, cssReference].join(eol);
  const officialHeader = ['<head>', officialAnchor, cssReference].join(eol);
  if (count(prepared, trialHeader) !== 1) throw new Error('Candidate header does not match the prepared trial exactly.');
  const promoted = prepared.replace(trialHeader, officialHeader);
  validateMobileTableOfficial(promoted);
  return promoted;
}

function run(mode) {
  if (!existsSync(officialPath)) throw new Error('Missing demo.html.');
  if (!existsSync(stylesheetPath)) throw new Error('Missing mobile-table stylesheet.');
  const original = readFileSync(officialPath, 'utf8');
  if (mode === '--check') {
    validateMobileTableOfficial(original);
    console.log('Official mobile orders-table enhancement: valid. Stylesheet, scroll hint and accessible region verified.');
    return;
  }
  if (mode !== '--apply') throw new Error('Usage: node scripts/promote-mobile-table.mjs --apply | --check');
  if (!existsSync(candidatePath)) throw new Error('Mobile-table candidate missing. Run node scripts/build-mobile-table-trial.mjs --prepare first.');
  const candidate = readFileSync(candidatePath, 'utf8');
  const next = safeMobileTablePromotion(original, candidate);
  writeFileSync(officialPath, next, 'utf8');
  console.log('Official demo promoted: responsive orders table is now linked and accessible.');
  console.log('Before commit, rollback if needed: git restore -- demo.html');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3 || !['--apply', '--check'].includes(process.argv[2])) {
      throw new Error('Usage: node scripts/promote-mobile-table.mjs --apply | --check');
    }
    run(process.argv[2]);
  } catch (error) {
    console.error(`Mobile-table promotion aborted: ${error.message}`);
    process.exitCode = 1;
  }
}
