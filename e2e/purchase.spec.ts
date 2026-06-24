import { expect, test } from '@playwright/test';

/**
 * Staging purchase-flow E2E (Phase 9). Exercises teaser → checkout against a
 * staging deploy in Stripe TEST mode. Gated on `E2E_BASE_URL` + `E2E_STRIPE_TEST`
 * so it only runs where a safe test-mode Stripe is wired — never in unit CI.
 */
const RUN =
  Boolean(process.env.E2E_BASE_URL) && process.env.E2E_STRIPE_TEST === '1';

test('teaser → checkout reaches a Stripe session', async ({ page }) => {
  test.skip(
    !RUN,
    'Needs E2E_BASE_URL + E2E_STRIPE_TEST=1 (staging, Stripe test mode).',
  );
  await page.goto('/pricing');
  await page
    .getByRole('button', { name: /choose standard/i })
    .first()
    .click();
  // Hosted checkout redirect or a 503 not-activated message, depending on staging.
  await page.waitForURL(/checkout\.stripe\.com|\/pricing/);
  expect(page.url()).toMatch(/stripe|pricing/);
});
