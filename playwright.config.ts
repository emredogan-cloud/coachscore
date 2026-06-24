import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config (Phase 9). Runs against a deployed target via
 * `E2E_BASE_URL` (staging/preview) — specs self-skip when it is unset, so the
 * suite never blocks the unit-test CI. Browsers install with
 * `pnpm test:e2e:install`; run with `E2E_BASE_URL=… pnpm test:e2e`.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: { baseURL, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
