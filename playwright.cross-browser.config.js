'use strict';

/**
 * Playwright cross-browser smoke test matrix — issue #653
 *
 * Runs the smoke suite on Chrome, Firefox, Safari (WebKit), and Edge in CI.
 * Target: all 4 browsers pass within 10 minutes when sharded.
 *
 * Usage:
 *   npx playwright test --config=playwright.cross-browser.config.js
 *
 * CI sharding example (4 shards, one per browser):
 *   npx playwright test --config=playwright.cross-browser.config.js --shard=1/4
 */

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/cross-browser',
  timeout: 30_000,
  retries: 3,            // 3 retries → flaky quarantine: single-browser failures flagged separately
  workers: 2,
  reporter: [
    ['list'],
    ['html',  { outputFolder: 'playwright-report/cross-browser', open: 'never' }],
    ['json',  { outputFile:   'playwright-report/cross-browser/results.json'  }],
    ['github'],           // per-browser pass/fail annotations on PRs
  ],
  use: {
    baseURL:          process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace:            'on-first-retry',
    screenshot:       'only-on-failure',
    video:            'retain-on-failure',
    actionTimeout:    10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    // ── Chrome (Chromium) ───────────────────────────────────────────────────
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Firefox ─────────────────────────────────────────────────────────────
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // ── Safari (WebKit) ─────────────────────────────────────────────────────
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // ── Microsoft Edge ──────────────────────────────────────────────────────
    {
      name: 'msedge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
  ],

  // Flaky quarantine: a test that fails in exactly one browser but passes on
  // 3 retries in that browser is quarantined (tagged in the JSON report) and
  // reported separately in CI rather than failing the whole matrix.
  // See docs/cross-browser-flaky-quarantine.md for the quarantine procedure.
});
