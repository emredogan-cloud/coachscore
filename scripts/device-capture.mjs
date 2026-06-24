// Real-device-viewport capture of the running production build (localhost:3000).
// Mobile viewport matches the connected Xiaomi 22095RA98C (1080x2408 @440dpi →
// ~393x876 CSS px, DPR ~2.75). Same server the physical device loads over adb
// reverse; this just drives it deterministically in English for the corpus.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'http://localhost:3000';
const OUT = 'screenshots';
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  ['home', '/'],
  ['onboarding', '/onboarding'],
  ['intake', '/intake'],
  ['pricing', '/pricing'],
  ['products-hub', '/products'],
  ['product-replay-doctor', '/products/replay_doctor'],
  ['product-base-doctor', '/products/base_doctor'],
  ['product-war-plan', '/products/war_plan'],
  ['report', '/report'],
  ['coach', '/coach'],
  ['coach-dashboard', '/coach/dashboard'],
  ['admin', '/admin'],
  ['admin-growth', '/admin/growth'],
  ['admin-health', '/admin/health'],
  ['referrals', '/referrals'],
  ['guides', '/guides'],
  ['guide-rush-checker', '/guides/is-my-account-rushed'],
  ['guide-th14-upgrade', '/guides/th14-upgrade-order-2026'],
];

const results = [];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 393, height: 876 },
  deviceScaleFactor: 2.75,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (Linux; Android 13; 22095RA98C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
});
// Pre-grant analytics consent so the banner doesn't overlay every screen.
await context.addInitScript(() => {
  try {
    window.localStorage.setItem('cs_consent', 'granted');
  } catch {}
});

async function capture(name, path, { full = true } = {}) {
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
  let status = 0;
  try {
    const resp = await page.goto(`${BASE}${path}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    status = resp ? resp.status() : 0;
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  } catch (e) {
    consoleErrors.push(`navfail: ${e.message}`);
  }
  results.push({ name, path, status, consoleErrors });
  return page;
}

for (const [name, path] of ROUTES) {
  await capture(name, path);
}

// --- Interaction flows ------------------------------------------------------

// Onboarding: capture each step if a "next"/CTA advances it.
try {
  const page = await context.newPage();
  await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.screenshot({
    path: `${OUT}/onboarding-step-1.png`,
    fullPage: true,
  });
  results.push({
    name: 'onboarding-step-1',
    path: '/onboarding',
    status: 200,
    consoleErrors: [],
  });
  await page.close();
} catch (e) {
  results.push({
    name: 'onboarding-step-1',
    path: '/onboarding',
    status: 0,
    consoleErrors: [String(e)],
  });
}

// Product submission: fill the ReplayDoctor form and submit → inline report.
try {
  const page = await context.newPage();
  const errs = [];
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
  await page.goto(`${BASE}/products/replay_doctor`, {
    waitUntil: 'networkidle',
  });
  await page.waitForTimeout(400);
  const submit = page.getByRole('button', { name: /get my analysis/i });
  if (await submit.count()) {
    await submit.first().click();
    // AI enrichment makes a real Anthropic call (~5s) before the report renders.
    await page.waitForTimeout(9000);
  }
  await page.screenshot({
    path: `${OUT}/product-replay-result.png`,
    fullPage: true,
  });
  results.push({
    name: 'product-replay-result',
    path: '/products/replay_doctor (submitted)',
    status: 200,
    consoleErrors: errs,
  });
  await page.close();
} catch (e) {
  results.push({
    name: 'product-replay-result',
    path: 'submit',
    status: 0,
    consoleErrors: [String(e)],
  });
}

// Report flow: try the teaser/CTA on /report.
try {
  const page = await context.newPage();
  await page.goto(`${BASE}/report`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/report-state.png`, fullPage: true });
  results.push({
    name: 'report-state',
    path: '/report',
    status: 200,
    consoleErrors: [],
  });
  await page.close();
} catch {}

// Offline shell (PWA) — load the static offline page.
try {
  const page = await context.newPage();
  await page.goto(`${BASE}/offline.html`, { waitUntil: 'load' });
  await page.screenshot({ path: `${OUT}/offline-shell.png`, fullPage: true });
  results.push({
    name: 'offline-shell',
    path: '/offline.html',
    status: 200,
    consoleErrors: [],
  });
  await page.close();
} catch {}

await browser.close();
writeFileSync(`${OUT}/_capture-results.json`, JSON.stringify(results, null, 2));
const failures = results.filter(
  (r) => r.status >= 400 || r.status === 0 || r.consoleErrors.length,
);
console.log(
  `captured ${results.length} screens; ${failures.length} with errors/non-200`,
);
for (const f of failures) {
  console.log(
    `  [${f.status}] ${f.name} ${f.path} :: ${f.consoleErrors.slice(0, 2).join(' | ')}`,
  );
}
