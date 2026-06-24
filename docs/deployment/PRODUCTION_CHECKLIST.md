# Production Deployment Checklist (Phase 9)

Run before every production deploy (most are one-time at first activation).

## Gates
- [ ] CI green on `main`: Validation · Security · Quality · Production Build.
- [ ] `pnpm validate` + `pnpm test:coverage` (≥ 90/80) locally on the release commit.
- [ ] Changelog / PR descriptions reviewed; ADR added/updated if architecture changed.

## Credentials (production)
- [ ] Supabase prod project (EU), PITR enabled, `DATABASE_URL` (pooled for serverless, direct for DDL).
- [ ] Supabase Auth wired (replaces the anonymous identity resolver in `lib/auth/identity.ts`).
- [ ] Stripe **live** keys + live webhook secret; Connect configured for payouts.
- [ ] Resend prod domain (SPF/DKIM verified); R2 prod bucket; Anthropic key with a budget alert.
- [ ] PostHog/Plausible prod; `SENTRY_DSN` + `BETTERSTACK_HEARTBEAT_URL` for observability.

## Data + security
- [ ] **Reference-data verification complete** (or paid generation restricted to verified Town Halls) — `assertPaidReportAllowed` must not throw for any sellable TH.
- [ ] Migrations applied; **cross-tenant RLS suite green** against prod-shaped data.
- [ ] No service-role key in client bundle; security headers present; `pnpm audit --prod` clean.

## Post-deploy verification
- [ ] `/api/health` 200 with expected activation matrix.
- [ ] Synthetic purchase (live, refunded) completes end-to-end; webhook fulfills; entitlement granted.
- [ ] Error reporter + uptime heartbeat receiving events.
- [ ] Rollback path confirmed (previous Vercel deployment promotable).
