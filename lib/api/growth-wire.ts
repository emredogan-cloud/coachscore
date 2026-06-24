/**
 * Growth wiring (Phase 7) — the activation boundary. Resolves the live Drizzle
 * repositories + analytics sink for the referral and growth-dashboard services,
 * and the request identity. Identity is stubbed anonymous until Supabase Auth is
 * wired (so referral/dashboard endpoints report not_activated). Exercised at
 * activation; the handlers inject fakes in tests, so this file is outside
 * coverage.
 */

import { resolveIdentity } from '@/lib/auth';
import type { Identity } from '@/lib/auth';
import { AnalyticsService, defaultAnalyticsProvider } from '@/lib/analytics';
import { createDrizzleRepositories } from '@/lib/db';
import { GrowthService } from '@/lib/growth';
import { ReferralService } from '@/lib/referrals';

/** Delegates to the central identity resolver (Phase 9). */
export function resolveGrowthIdentity(): Identity {
  return resolveIdentity();
}

export function resolveReferralService(): ReferralService {
  const repos = createDrizzleRepositories();
  return new ReferralService({
    repos,
    analytics: new AnalyticsService({
      provider: defaultAnalyticsProvider(),
      repo: repos.analyticsEvents,
    }),
  });
}

export function resolveGrowthService(): GrowthService {
  return new GrowthService(createDrizzleRepositories());
}
