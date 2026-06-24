# Staging Checklist (Phase 9)

A staging environment that mirrors production with **test-mode** credentials.

- [ ] Separate Supabase project (EU region) with `DATABASE_URL` + Auth configured.
- [ ] All migrations applied through the latest (`migrations/` in order); `pnpm validate:reference` green.
- [ ] **Cross-tenant RLS suite green:** `SUPABASE_RLS_TEST=1 pnpm test:integration`.
- [ ] Stripe in **test mode** (`STRIPE_SECRET_KEY` test key + a test webhook endpoint → `STRIPE_WEBHOOK_SECRET`).
- [ ] Resend in a sandbox/test domain; R2 staging bucket; Anthropic key (low budget cap).
- [ ] PostHog/Plausible pointed at a staging project.
- [ ] `E2E_BASE_URL` set to the staging URL; `pnpm test:e2e:install` then `pnpm test:e2e` green (smoke).
- [ ] Staging purchase flow (`E2E_STRIPE_TEST=1`) reaches Stripe test checkout and the webhook fulfills the order.
- [ ] `/api/health` shows the expected `activatedCount`; `/admin/health` reachable by an admin only.
- [ ] Lifecycle dispatch dry-run; emails land in the test inbox; unsubscribe works.
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` (or any non-`NEXT_PUBLIC_` secret) in the client bundle.
