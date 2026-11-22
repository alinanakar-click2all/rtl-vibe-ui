/** Stage 66: official responsive orders-table regression tests (included in CI). */
import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const official = join(root, 'demo.html');
const screenshots = join(root, 'browser-check/artifacts');
const region = '.grid-2 > article.card:first-child .table-wrap';
const table = `${region} table`;

async function open(page, width) {
  if (!existsSync(official)) throw new Error('Missing official demo.html');
  await page.setViewportSize({ width, height: 850 });
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(official).href,{waitUntil:'load'});
  await expect(page.locator(region)).toBeVisible();
  await expect(page.locator('link[href="assets/demo-mobile-table-trial.css"]')).toHaveCount(1);
  expect(errors).toEqual([]);
}

for (const width of [320,400]) {
  test(`official mobile orders ${width}px: readable cells, contained scroll and no page overflow`,async({page})=>{
    await open(page,width);
    await expect(page.locator('.orders-scroll-hint')).toBeVisible();
    await expect(page.locator(region)).toHaveAttribute('role','region');
    await expect(page.locator(region)).toHaveAttribute('tabindex','0');
    await expect(page.locator(region)).toHaveAttribute('aria-describedby','orders-scroll-hint');
    await expect(page.locator(`${table} thead th`)).toHaveCount(4);
    await expect(page.locator(`${table} tbody tr`)).toHaveCount(2);
    await expect(page.locator(`${table} td code`).first()).toHaveCSS('white-space','nowrap');
    await expect(page.locator(`${table} .pill`).last()).toHaveCSS('white-space','nowrap');
    const bounds = await page.evaluate(sel=>{
      const el=document.querySelector(sel);
      return {viewport:document.documentElement.clientWidth,html:document.documentElement.scrollWidth,body:document.body.scrollWidth,box:el.clientWidth,inside:el.scrollWidth};
    },region);
    expect(bounds.html,JSON.stringify(bounds)).toBeLessThanOrEqual(bounds.viewport+1);
    expect(bounds.body,JSON.stringify(bounds)).toBeLessThanOrEqual(bounds.viewport+1);
    expect(bounds.inside,JSON.stringify(bounds)).toBeGreaterThan(bounds.box+40);
    await page.locator(region).focus();
    await expect(page.locator(region)).toBeFocused();
    const scroll=await page.locator(region).evaluate(el=>{
      const before=el.scrollLeft,available=el.scrollWidth-el.clientWidth;
      el.scrollLeft=document.documentElement.dir==='rtl'?-available:available;
      const edge=el.getBoundingClientRect(),status=el.querySelector('tbody tr:last-child td:last-child .pill').getBoundingClientRect();
      return {before,after:el.scrollLeft,available,fullStatus:status.left>=edge.left-1&&status.right<=edge.right+1};
    });
    expect(scroll.after).not.toBe(scroll.before);
    expect(scroll.fullStatus,JSON.stringify(scroll)).toBe(true);
    mkdirSync(screenshots,{recursive:true});
    await page.locator('.grid-2 > article.card:first-child').screenshot({path:join(screenshots,`stage66-official-orders-${width}.png`),animations:'disabled'});
  });
}

test('official desktop table at 1440px preserves native layout and hides scroll hint',async({page})=>{
  await open(page,1440);
  await expect(page.locator('.orders-scroll-hint')).toBeHidden();
  await expect(page.locator(table)).toHaveCSS('display','table');
  await expect(page.locator(`${table} thead th`)).toHaveCount(4);
  const inner=await page.locator(region).evaluate(el=>el.clientWidth);
  expect(inner).toBeGreaterThan(350);
});

test('official orders table remains usable in LTR and dark mode',async({page})=>{
  await open(page,400);
  await page.locator('#theme-toggle-top').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.locator('#dir-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('dir','ltr');
  await expect(page.locator('.orders-scroll-hint')).toBeVisible();
  const overflow=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  expect(overflow.scroll).toBeLessThanOrEqual(overflow.width+1);
});
