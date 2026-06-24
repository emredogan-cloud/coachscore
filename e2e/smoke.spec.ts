import { expect, test } from '@playwright/test';

/**
 * Public-surface smoke E2E (Phase 9). Runs against a deployed target; each test
 * self-skips without `E2E_BASE_URL` so it is a staging/preview gate, not a
 * unit-CI gate.
 */
const STAGING = Boolean(process.env.E2E_BASE_URL);

test.describe('public surfaces', () => {
  test('landing page loads', async ({ page }) => {
    test.skip(!STAGING, 'E2E_BASE_URL not set — staging only.');
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'CoachScore' }),
    ).toBeVisible();
  });

  test('pricing page renders', async ({ page }) => {
    test.skip(!STAGING, 'E2E_BASE_URL not set — staging only.');
    await page.goto('/pricing');
    await expect(page.getByRole('heading', { name: 'Pricing' })).toBeVisible();
  });

  test('a programmatic SEO guide renders', async ({ page }) => {
    test.skip(!STAGING, 'E2E_BASE_URL not set — staging only.');
    await page.goto('/guides/is-my-account-rushed');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('health endpoint reports ok', async ({ request }) => {
    test.skip(!STAGING, 'E2E_BASE_URL not set — staging only.');
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).status).toBe('ok');
  });
});
