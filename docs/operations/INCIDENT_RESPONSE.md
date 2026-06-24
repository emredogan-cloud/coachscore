# Incident Response (Phase 9)

## Severities
- **SEV1** — paid flow down or data integrity/security risk (checkout failing, RLS bypass suspected, data leak). All-hands, immediate.
- **SEV2** — major feature degraded (AI drafts failing, queue backlog, email not sending). Same-day.
- **SEV3** — minor/cosmetic, no revenue/trust impact. Next business day.

## First response (any SEV)
1. Acknowledge; open an incident channel + timeline.
2. Check `GET /api/health` + Vercel logs + the error reporter (`lib/observability` → Sentry at activation).
3. Decide: **rollback** (Vercel promote previous) vs **forward-fix**. Prefer rollback for SEV1.
4. Stop the bleeding (feature-flag off via `lib/experiments` flags, disable the affected route, or pause the queue) before root-causing.

## Playbooks
- **Checkout/webhook failing (SEV1):** verify `STRIPE_*` env + webhook signature + the Stripe dashboard event log. Replay failed webhook events from Stripe once fixed (handler is idempotent by `client_reference_id`).
- **Suspected RLS bypass (SEV1):** rotate `SUPABASE_SERVICE_ROLE_KEY`; confirm no service-role key reached the client bundle; run the cross-tenant RLS suite; audit `audit_logs`.
- **AI drafts failing (SEV2):** check `ANTHROPIC_API_KEY` + Anthropic status; `ResilientProvider` retries transient errors; failures dead-letter — inspect the DLQ. Human-review tier unaffected (deterministic report still renders).
- **Queue backlog (SEV2):** inspect `jobs` by status; scale workers down/up; reprocess dead-letters after the fix.
- **Email not sending (SEV2/3):** check `RESEND_API_KEY` + Resend dashboard; lifecycle messages stay `scheduled` and resume on fix (nothing lost).

## After action
- Write a blameless post-mortem (timeline, root cause, fix, prevention). File follow-ups. Update this doc + the runbook if a new playbook is warranted.
