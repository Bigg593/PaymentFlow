'use strict';

/**
 * Jest-level validation of the cross-browser smoke matrix config — issue #653
 * (also satisfies the acceptance criterion for issue #338).
 *
 * Does not run Playwright itself; instead it validates that:
 *   1. playwright.cross-browser.config.js is present and exports a valid config
 *   2. All 4 required browser projects are defined (chromium, firefox, webkit, msedge)
 *   3. The smoke test file exists in tests/cross-browser/
 *   4. The smoke tests reference all 4 required flows
 *   5. retries >= 3 (flaky quarantine mechanism)
 *   6. Per-browser reporting is configured (json reporter present)
 */

const fs   = require('fs');
const path = require('path');

const CONFIG_PATH      = path.resolve(__dirname, '..', 'playwright.cross-browser.config.js');
const SMOKE_SPEC_PATH  = path.resolve(__dirname, 'cross-browser', 'smoke.spec.js');

// ── Config file ───────────────────────────────────────────────────────────────

describe('playwright.cross-browser.config.js', () => {
  test('config file exists', () => {
    expect(fs.existsSync(CONFIG_PATH)).toBe(true);
  });

  test('config exports a valid object', () => {
    const cfg = require(CONFIG_PATH);
    expect(typeof cfg).toBe('object');
    expect(cfg).not.toBeNull();
  });

  test('all 4 browser projects are defined', () => {
    const cfg = require(CONFIG_PATH);
    const projectNames = (cfg.projects || []).map((p) => p.name);
    expect(projectNames).toContain('chromium');
    expect(projectNames).toContain('firefox');
    expect(projectNames).toContain('webkit');
    expect(projectNames).toContain('msedge');
  });

  test('has at least 4 projects (one per browser)', () => {
    const cfg = require(CONFIG_PATH);
    expect((cfg.projects || []).length).toBeGreaterThanOrEqual(4);
  });

  test('retries >= 3 for flaky quarantine', () => {
    const cfg = require(CONFIG_PATH);
    expect(typeof cfg.retries).toBe('number');
    expect(cfg.retries).toBeGreaterThanOrEqual(3);
  });

  test('json reporter is configured for per-browser CI summary', () => {
    const cfg = require(CONFIG_PATH);
    const reporters = (cfg.reporter || []).map((r) => (Array.isArray(r) ? r[0] : r));
    expect(reporters).toContain('json');
  });

  test('testDir points to tests/cross-browser', () => {
    const cfg = require(CONFIG_PATH);
    expect(cfg.testDir).toMatch(/cross-browser/);
  });
});

// ── Smoke spec file ───────────────────────────────────────────────────────────

describe('tests/cross-browser/smoke.spec.js', () => {
  test('smoke spec file exists', () => {
    expect(fs.existsSync(SMOKE_SPEC_PATH)).toBe(true);
  });

  test('covers login flow', () => {
    const src = fs.readFileSync(SMOKE_SPEC_PATH, 'utf8');
    expect(src.toLowerCase()).toMatch(/login/);
  });

  test('covers pay fees / payment form flow', () => {
    const src = fs.readFileSync(SMOKE_SPEC_PATH, 'utf8');
    expect(src.toLowerCase()).toMatch(/pay.?fee|payment/);
  });

  test('covers receipt / payment status flow', () => {
    const src = fs.readFileSync(SMOKE_SPEC_PATH, 'utf8');
    expect(src.toLowerCase()).toMatch(/receipt|payment status/);
  });

  test('covers CSV download / report flow', () => {
    const src = fs.readFileSync(SMOKE_SPEC_PATH, 'utf8');
    expect(src.toLowerCase()).toMatch(/csv|report|download/);
  });

  test('tags tests with browserName for per-browser CI output', () => {
    const src = fs.readFileSync(SMOKE_SPEC_PATH, 'utf8');
    expect(src).toMatch(/browserName/);
  });
});

// ── Flaky quarantine documentation ───────────────────────────────────────────

describe('flaky quarantine mechanism', () => {
  test('retries=3 in config implements the quarantine policy', () => {
    const cfg = require(CONFIG_PATH);
    // A test that fails once but passes within 3 retries is NOT a hard failure.
    // A test that fails all 3 retries in a single browser is quarantined and
    // reported separately via the JSON reporter rather than failing the matrix.
    expect(cfg.retries).toBeGreaterThanOrEqual(3);
  });

  test('config uses json reporter to enable quarantine report parsing', () => {
    const cfg = require(CONFIG_PATH);
    const reporters = (cfg.reporter || []).map((r) => (Array.isArray(r) ? r[0] : r));
    expect(reporters).toContain('json');
  });
});
