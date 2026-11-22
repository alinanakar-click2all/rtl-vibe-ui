/** Stage 60: official dashboard analytics regression tests; included in CI. */
import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const official = join(root, 'demo.html');
const artifacts = join(root, 'browser-check/artifacts');
async function open(page) {
  if (!existsSync(official)) throw new Error('Missing official demo.html');
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(official).href, { waitUntil: 'load' });
  await expect(page.locator('.v57-overview')).toBeVisible();
  expect(errors).toEqual([]);
}

test('official visual dashboard renders sample chart, source labels and data table', async ({ page }) => {
  await open(page);
  await expect(page.locator('.v57-svg[role="img"]')).toBeVisible();
  await expect(page.locator('#v57-data-body tr')).toHaveCount(7);
  await expect(page.locator('.v57-demo-label')).toContainText('داده واقعی متصل نیستند');
  await expect(page.locator('[data-v57-period="7"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.v57-data-toggle').click();
  await expect(page.locator('.v57-data-table')).toBeVisible();
});

test('period buttons update chart, visible summary and accessible table', async ({ page }) => {
  await open(page);
  const value7 = await page.locator('#v57-total').textContent();
  await page.locator('[data-v57-period="30"]').click();
  await expect(page.locator('[data-v57-period="30"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#v57-data-body tr')).toHaveCount(6);
  await expect(page.locator('#v57-chart-heading')).toContainText('۳۰ روز');
  const value30 = await page.locator('#v57-total').textContent();
  expect(value30).not.toEqual(value7);
  await page.locator('[data-v57-period="7"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#v57-data-body tr')).toHaveCount(7);
});

test('official visual dashboard keeps original theme, direction and tab controls', async ({ page }) => {
  await open(page);
  await page.locator('#theme-toggle-top').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('#dir-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await page.locator('#tab-orders').click();
  await expect(page.locator('#panel-overview')).toBeHidden();
  await page.locator('#tab-overview').click();
  await expect(page.locator('.v57-overview')).toBeVisible();
});

for (const width of [1440, 400, 320]) {
  test(`official visual dashboard at ${width}px has no root horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await open(page);
    const bounds = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, html: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    expect(bounds.html, JSON.stringify(bounds)).toBeLessThanOrEqual(bounds.viewport + 1);
    mkdirSync(artifacts, { recursive: true });
    await page.screenshot({ path: join(artifacts, `stage60-visual-${width}.png`), fullPage: true, animations: 'disabled' });
  });
}
