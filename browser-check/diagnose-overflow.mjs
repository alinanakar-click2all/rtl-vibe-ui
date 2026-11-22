#!/usr/bin/env node
/**
 * RTL Vibe UI – Non-destructive horizontal-overflow diagnosis.
 * Run from repository root: node browser-check/diagnose-overflow.mjs
 * Uses the @playwright/test package already installed in browser-check.
 * Does not edit the HTML, CSS, JS, or Git working tree.
 */
import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const preview = join(root, 'demo-upgraded-preview.html');
if (!existsSync(preview)) {
  console.error(`Missing preview: ${preview}\nGenerate it using: node scripts/build-demo-preview.mjs`);
  process.exit(2);
}

const candidates = [
  {
    name: 'A: minmax(0, 1fr) for grid-2 / table area',
    css: '@media(max-width:580px){.grid-2{grid-template-columns:minmax(0,1fr)!important}.grid-2>.card,.table-wrap{min-inline-size:0;max-inline-size:100%}}',
  },
  {
    name: 'B: minmax(0, 1fr) for form grid',
    css: '@media(max-width:580px){.form-grid{grid-template-columns:minmax(0,1fr)!important}.form-grid>.field{min-inline-size:0}.field input,.field select,.field textarea{max-inline-size:100%;min-inline-size:0}}',
  },
  {
    name: 'C: minmax(0, 1fr) for stats',
    css: '@media(max-width:580px){.stats{grid-template-columns:minmax(0,1fr)!important}.stats>.card{min-inline-size:0}}',
  },
  {
    name: 'D: allow chat and cards to shrink',
    css: '@media(max-width:580px){.card,.chat-input,.chat-input input{min-inline-size:0}.chat-input input{max-inline-size:100%}}',
  },
  {
    name: 'E: allow topbar search to shrink',
    css: '@media(max-width:580px){.topbar,.search,.search input{min-inline-size:0}.topbar-actions{flex-shrink:0}}',
  },
  {
    name: 'F: allow content children to shrink (diagnostic only)',
    css: '@media(max-width:580px){.content,.content>*,.grid-2,.grid-2>*,.card{min-inline-size:0}}',
  },
  {
    name: 'G: allow page controls and pagination to wrap',
    css: '@media(max-width:580px){.page-head>div,.pagination,.page-list{min-inline-size:0}.page-head>div:last-child,.page-list{flex-wrap:wrap}}',
  },
];

async function measure(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return {
      viewport: doc.clientWidth,
      htmlScrollWidth: doc.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      overflowPx: Math.max(0, doc.scrollWidth - doc.clientWidth),
      direction: getComputedStyle(doc).direction,
    };
  });
}

async function inspect(page) {
  return page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const label = el => {
      const id = el.id ? `#${el.id}` : '';
      const cls = (typeof el.className === 'string' ? el.className : '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(x => `.${x}`).join('');
      return `${el.tagName.toLowerCase()}${id}${cls}`;
    };
    const nodes = [];
    for (const el of document.body.querySelectorAll('*')) {
      if (!el.getClientRects().length) continue;
      const r = el.getBoundingClientRect();
      if (!Number.isFinite(r.left) || !Number.isFinite(r.right)) continue;
      const leftExcess = Math.max(0, -r.left);
      const rightExcess = Math.max(0, r.right - viewport);
      const excess = Math.max(leftExcess, rightExcess);
      if (excess < 1.5) continue;
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || s.display === 'none') continue;
      let ancestor = el.parentElement;
      let scrollParent = '';
      while (ancestor && ancestor !== document.body) {
        const st = getComputedStyle(ancestor);
        if (['auto', 'scroll', 'hidden', 'clip'].includes(st.overflowX)) {
          scrollParent = `${label(ancestor)} [${st.overflowX}]`;
          break;
        }
        ancestor = ancestor.parentElement;
      }
      nodes.push({
        el: label(el),
        parent: el.parentElement ? label(el.parentElement) : '',
        left: Math.round(r.left * 10) / 10,
        right: Math.round(r.right * 10) / 10,
        width: Math.round(r.width * 10) / 10,
        excess: Math.round(excess * 10) / 10,
        scrollParent,
        display: s.display,
        minInlineSize: s.minInlineSize,
        overflowX: s.overflowX,
        gridColumns: s.display.includes('grid') ? s.gridTemplateColumns : undefined,
      });
    }
    return nodes.sort((a, b) => b.excess - a.excess).slice(0, 24);
  });
}

function print(label, value) {
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(value, null, 2));
}

let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 320, height: 824 }, locale: 'fa-IR' });
  await page.goto(pathToFileURL(preview).href, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  print('320px initial layout', await measure(page));
  print('Initial out-of-viewport elements (top 24)', await inspect(page));

  const menu = page.locator('#mobile-nav-toggle');
  if (await menu.isVisible()) {
    await menu.click();
    await page.keyboard.press('Escape');
    print('After mobile menu close (immediate)', await measure(page));
    await page.waitForTimeout(400);
    print('After mobile menu close (settled)', await measure(page));
  }
  print('Post-interaction out-of-viewport elements (top 24)', await inspect(page));
  const baseline = await measure(page);

  const experiments = [];
  for (const candidate of candidates) {
    const style = await page.addStyleTag({ content: candidate.css });
    const result = await measure(page);
    experiments.push({ name: candidate.name, overflowPx: result.overflowPx, reducedByPx: baseline.overflowPx - result.overflowPx });
    await style.evaluate(el => el.remove());
  }
  print('Temporary CSS experiments (none saved)', experiments);
  console.log('\nDone. No project files were changed. Share these terminal results for a targeted fix.');
} catch (err) {
  console.error(`Diagnostic failed: ${err.stack || err}`);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
}
