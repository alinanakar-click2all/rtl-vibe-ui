#!/usr/bin/env node
/**
 * Build a non-destructive preview from the original demo.html.
 * Original demo.html is never written; output: demo-upgraded-preview.html.
 * Fails closed if the original structure has changed.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(rootDir, 'demo.html');
const outputPath = resolve(rootDir, 'demo-upgraded-preview.html');
const stylePath = resolve(rootDir, 'assets/demo-enhancements.css');
const scriptPath = resolve(rootDir, 'assets/demo-enhancements.js');
const marker = 'RTL Vibe UI — Demo enhancement preview';

function replaceExactlyOnce(source, oldText, newText, label) {
  const occurrences = source.split(oldText).length - 1;
  if (occurrences !== 1) throw new Error(`${label}: expected exactly one match, got ${occurrences}. Original demo.html was not changed.`);
  return source.replace(oldText, () => newText); // Avoid $& / $$ replacement-string expansion.
}
// Match the real demo's topbar using its semantic markup rather than a fixed
// count of spaces. Keep the one-match guard: unexpected layouts fail closed.
function addMobileToggleToTopbar(source) {
  const pattern = /(<header class="topbar">)(\r?\n)([ \t]*)(?=<label class="search">)/g;
  const matches = [...source.matchAll(pattern)];
  if (matches.length !== 1) {
    throw new Error(`topbar: expected exactly one match, got ${matches.length}. Original demo.html was not changed.`);
  }
  return source.replace(pattern, (_full, header, lineBreak, indent) =>
    `${header}${lineBreak}${indent}<button type="button" class="mobile-nav-toggle" id="mobile-nav-toggle" aria-expanded="false" aria-controls="mobile-sidebar" aria-label="باز کردن منوی اصلی">☰</button>${lineBreak}${indent}`
  );
}
export function buildPreview(html, css, js) {
  if (!html.startsWith('<!DOCTYPE html>') || !html.includes('<html dir="rtl" lang="fa"')) {
    throw new Error('Unknown demo version; source lacks expected HTML markers.');
  }
  if (html.includes(marker) || html.includes('id="mobile-nav-toggle"')) {
    throw new Error('Source seems modified or already enhanced; pass the unchanged demo.html.');
  }
  const from = html.indexOf('/* Modal */');
  const to = html.indexOf('/* Toast */', from);
  if (from < 0 || to < from || html.indexOf('/* Modal */', from + 1) !== -1) {
    throw new Error('Cannot locate the exact original inline Modal–Accordion handlers; aborting.');
  }
  // Remove only the older event handlers, not the DOM markup or Toast implementation.
  html = html.slice(0, from) + '/* Modal, Drawer, Tabs, Accordion: handled by preview enhancement script. */\n' + html.slice(to);
  html = replaceExactlyOnce(html, '<aside class="sidebar">',
    '<aside class="sidebar" id="mobile-sidebar">\n' +
    '    <button type="button" class="mobile-nav-close" id="mobile-nav-close" aria-label="بستن منوی موبایل">✕</button>',
    'sidebar');
  html = addMobileToggleToTopbar(html);
  html = replaceExactlyOnce(html, '<div class="app">',
    '<div class="mobile-nav-backdrop" id="mobile-nav-backdrop" aria-hidden="true"></div>\n<div class="app">',
    'app');
  html = replaceExactlyOnce(html,
    '<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">',
    '<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" aria-hidden="true" inert>',
    'drawer');
  html = replaceExactlyOnce(html, '<p class="field-error">شماره باید ۱۱ رقم باشد.</p>',
    '<p class="field-error" id="phone-hint">شماره باید ۱۱ رقم باشد.</p>',
    'phone hint');
  html = replaceExactlyOnce(html, '</head>', `<!-- ${marker}: CSS -->\n<style>\n${css}\n</style>\n</head>`, 'head');
  html = replaceExactlyOnce(html, '</body>', `<!-- ${marker}: JS -->\n<script>\n${js}\n</script>\n</body>`, 'body');
  return html;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (!existsSync(sourcePath)) throw new Error(`Missing ${sourcePath}. Extract the ZIP into the repository root.`);
    const html = readFileSync(sourcePath, 'utf8');
    const css = readFileSync(stylePath, 'utf8');
    const js = readFileSync(scriptPath, 'utf8');
    const preview = buildPreview(html, css, js);
    writeFileSync(outputPath, preview, 'utf8');
    console.log(`Generated: ${outputPath}`);
    console.log('Original demo.html: untouched.');
  } catch (error) {
    console.error(`Preview build aborted: ${error.message}`);
    process.exitCode = 1;
  }
}
