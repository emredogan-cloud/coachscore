/**
 * Live marketplace wiring (Phase 5) — the activation boundary. Resolves the
 * Drizzle-backed MarketplaceService + PayoutService and the request identity.
 * Identity is the anonymous stub until Supabase Auth is wired. Exercised at
 * activation; the handlers inject fakes in tests, so this file is outside coverage.
 */

import { createDrizzleRepositories } from '@/lib/db';
import { MarketplaceService } from '@/lib/marketplace';
import { createStripeConnectProvider, PayoutService } from '@/lib/payouts';

// Identity resolution is centralized in lib/auth (Phase 9); re-exported here so
// existing call sites keep importing it from the wire module.
export { resolveIdentity } from '@/lib/auth';

export function resolveMarketplaceService(): MarketplaceService {
  return new MarketplaceService(createDrizzleRepositories());
}

export function resolvePayoutService(): PayoutService {
  return new PayoutService({
    provider: createStripeConnectProvider(),
    repos: createDrizzleRepositories(),
  });
}
