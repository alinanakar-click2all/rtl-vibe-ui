import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.mjs',
  fullyParallel: false,
  workers: 1,
  timeout: 15_000,
  expect: { timeout: 5_000 },
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    browserName: 'chromium',
    channel: 'chrome', // Use Chrome already installed on Windows; no browser download.
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
    locale: 'fa-IR',
  },
});
