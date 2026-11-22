import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');
const previewPath = join(repoRoot, 'demo-upgraded-preview.html');
const artifactsDir = resolve(here, '../artifacts');

async function openPreview(page) {
  if (!existsSync(previewPath)) {
    throw new Error('Missing demo-upgraded-preview.html. Run: node scripts/build-demo-preview.mjs from the repository root.');
  }
  const exceptions = [];
  page.on('pageerror', error => exceptions.push(error.message));
  await page.goto(pathToFileURL(previewPath).href, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.app')).toBeVisible();
  // Runtime exceptions are checked after the page has loaded.
  expect(exceptions, `Browser JavaScript exceptions: ${exceptions.join(' | ')}`).toEqual([]);
}

async function focusInside(page, selector) {
  return page.evaluate(sel => {
    const container = document.querySelector(sel);
    return Boolean(container && document.activeElement && container.contains(document.activeElement));
  }, selector);
}

async function saveEvidence(page, file) {
  mkdirSync(artifactsDir, { recursive: true });
  await page.screenshot({ path: join(artifactsDir, file), fullPage: true, animations: 'disabled' });
}

test('desktop keeps the original RTL layout and allows theme and direction toggles', async ({ page }) => {
  await openPreview(page);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('.sidebar')).toBeVisible();
  const themeBefore = await page.locator('html').getAttribute('data-theme');
  await page.locator('#theme-toggle-top').click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', themeBefore);
  await saveEvidence(page, 'desktop-dark.png');
  await page.locator('#dir-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await saveEvidence(page, 'desktop-ltr.png');
});

test('modal traps Tab focus, closes with Escape and restores trigger focus', async ({ page }) => {
  await openPreview(page);
  await page.locator('#open-modal').click();
  await expect(page.locator('#modal')).toBeVisible();
  await expect(page.locator('.app')).toHaveAttribute('inert', '');
  expect(await focusInside(page, '#modal .modal')).toBe(true);
  for (const key of ['Tab', 'Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab']) {
    await page.keyboard.press(key);
    expect(await focusInside(page, '#modal .modal'), `Focus escaped modal after ${key}`).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal')).toBeHidden();
  await expect(page.locator('#open-modal')).toBeFocused();
});

test('filter drawer starts inert, traps focus, and becomes inert after closing', async ({ page }) => {
  await openPreview(page);
  await expect(page.locator('#drawer')).toHaveAttribute('inert', '');
  await page.locator('#open-drawer').click();
  await expect(page.locator('#drawer')).toHaveClass(/open/);
  await expect(page.locator('#drawer')).not.toHaveAttribute('inert', '');
  expect(await focusInside(page, '#drawer')).toBe(true);
  for (const key of ['Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab']) {
    await page.keyboard.press(key);
    expect(await focusInside(page, '#drawer'), `Focus escaped drawer after ${key}`).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('#drawer')).toHaveAttribute('inert', '');
  await expect(page.locator('#open-drawer')).toBeFocused();
});

test('tabs activate panels by click, Arrow key, Home and End', async ({ page }) => {
  await openPreview(page);
  const first = page.locator('#tab-overview');
  const second = page.locator('#tab-orders');
  await expect(first).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-orders')).toBeHidden();
  await first.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(second).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-orders')).toBeVisible();
  await page.keyboard.press('Home');
  await expect(first).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(second).toHaveAttribute('aria-selected', 'true');
  await first.click();
  await expect(page.locator('#panel-overview')).toBeVisible();
  // With only two tabs, this does not prove which arrow direction is correct;
  // directionality with 3+ tabs remains a separate test for the next iteration.
});

for (const width of [400, 320]) {
  test(`mobile menu, keyboard and horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 824 });
    await openPreview(page);
    const navToggle = page.locator('#mobile-nav-toggle');
    await expect(navToggle).toBeVisible();
    await expect(page.locator('#mobile-sidebar')).toHaveAttribute('inert', '');
    await saveEvidence(page, `mobile-${width}-closed.png`);
    await navToggle.click();
    await expect(navToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#mobile-sidebar')).toBeVisible();
    await expect(page.locator('.main')).toHaveAttribute('inert', '');
    expect(await focusInside(page, '#mobile-sidebar')).toBe(true);
    for (const key of ['Tab', 'Tab', 'Shift+Tab']) {
      await page.keyboard.press(key);
      expect(await focusInside(page, '#mobile-sidebar')).toBe(true);
    }
    await saveEvidence(page, `mobile-${width}-open.png`);
    await page.keyboard.press('Escape');
    await expect(navToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(navToggle).toBeFocused();
    await expect(page.locator('.main')).not.toHaveAttribute('inert', '');
    const metrics = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    expect(metrics.content, `Horizontal overflow: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(metrics.viewport + 1);
  });
}

test('phone input is associated with a descriptive hint', async ({ page }) => {
  await openPreview(page);
  await expect(page.locator('#phone-hint')).toHaveCount(1);
  await expect(page.locator('#f-phone')).toHaveAttribute('aria-describedby', /phone-hint/);
});
