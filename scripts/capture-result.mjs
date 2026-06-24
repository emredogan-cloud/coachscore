import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 393, height: 876 },
  deviceScaleFactor: 2.75,
  isMobile: true,
  hasTouch: true,
});
await ctx.addInitScript(() => {
  try {
    window.localStorage.setItem('cs_consent', 'granted');
  } catch {}
});
const page = await ctx.newPage();
await page.goto('http://localhost:3000/products/replay_doctor', {
  waitUntil: 'networkidle',
});
// Keep the loading-state capture as a separate, intentional artifact.
await page
  .getByRole('button', { name: /get my analysis/i })
  .first()
  .click();
await page.waitForTimeout(800);
await page.screenshot({
  path: 'screenshots/product-replay-loading.png',
  fullPage: true,
});
// Wait for the rendered report (engine summary/recommendations) — content-based.
try {
  await page
    .getByText('Recommendations', { exact: false })
    .first()
    .waitFor({ timeout: 45000 });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: 'screenshots/product-replay-result.png',
    fullPage: true,
  });
  console.log('RESULT captured');
} catch (e) {
  await page.screenshot({
    path: 'screenshots/product-replay-result.png',
    fullPage: true,
  });
  console.log('RESULT not rendered within timeout: ' + e.message);
}
await browser.close();
