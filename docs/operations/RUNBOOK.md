# Operations Runbook (Phase 9)

Operational procedures for the running service. Stack: Vercel (app) · Supabase (Postgres + Auth + RLS) · Cloudflare R2 (storage) · Stripe (+ Connect) · Resend (email) · Anthropic (AI) · PostHog/Plausible (analytics). The durable queue runs on the `jobs` table (Phase 8).

> Health at a glance: `GET /api/health` returns the activation matrix; `/admin/health` renders it. `activatedCount` = live subsystems.

## Deploy
- Production deploys on merge to `main` via the Vercel Git integration. CI (Validation/Security/Quality/Production Build) must be green first.
- Verify post-deploy: `/api/health` 200, key pages 200, no error spike in logs.

## Rollback
- Vercel → Deployments → promote the previous good deployment (instant). Code rollbacks that touch the DB also need the migration considered (most migrations are additive/`IF NOT EXISTS`; never auto-down-migrate in prod).

## Database migrations
- Generated offline with `drizzle-kit`; applied with the Supabase SQL editor / `psql` against the **direct** connection (5432) during a maintenance window. RLS migrations (`*_rls*.sql`) are idempotent-friendly. Always run on **staging** first and run the RLS cross-tenant suite (`SUPABASE_RLS_TEST=1 pnpm test:integration`).

## Key rotation
- Rotate `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `R2_*` in the Vercel project env; redeploy. Never commit secrets; `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — server-only.

## Queue operations (durable queue, Phase 8)
- **Inspect dead-letters:** query the `jobs` table `WHERE status='dead_letter'` (or `AsyncQueueStore.listByStatus('dead-letter')`).
- **Reprocess:** re-enqueue with the same idempotency key once the root cause is fixed — completed jobs dedupe, failed/dead-letter re-run.
- **Backlog:** AI cost/latency spikes show as growing `pending`/`running`. Mitigate by lowering concurrency; paid AI cost scales with revenue (see MONETIZATION).

## Lifecycle / email
- Lifecycle messages accrue as `scheduled` (Phase 7). Dispatch runs `LifecycleService.dispatchDue()` (cron/worker) once `RESEND_API_KEY` is set; until then they remain scheduled (never sent). Honor unsubscribe + consent.

## AI cost control (Phase 8)
- Prompt caching is on for the draft system prompt; response caching dedupes identical analyses. Watch spend with `CostAccountant`; `BudgetGuard` caps a request/job. If Opus spend spikes, confirm prompt-cache hit rate and that re-analyses are hitting the response cache.

## Reference-data (REVENUE BLOCKER)
- Paid report generation throws via `assertPaidReportAllowed` for any Town Hall with `needsVerification` debt. Burn down the reference table (`pnpm validate:reference`) or restrict paid generation to verified Town Halls **before** enabling paid checkout. This is a data task, not a credential.
