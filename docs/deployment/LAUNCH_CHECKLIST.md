# Launch Checklist (Phase 9)

The go/no-go for taking real money. Everything in `STAGING_CHECKLIST` + `PRODUCTION_CHECKLIST` must pass first; this layer is the business + trust + compliance gate.

## Hard blockers (no launch until all true)
- [ ] **Reference data verified** for every Town Hall offered for sale (the paid path is blocked otherwise — a data task, not a credential).
- [ ] **Supabase Auth live** and the cross-tenant RLS suite green — ownership is enforced at the database, not just the app.
- [ ] Live Stripe + verified webhook fulfillment (order → entitlement) proven by a real, refunded purchase.
- [ ] Observability live: error reporting (Sentry) + uptime heartbeat + alerting routes to a real channel.
- [ ] Durable queue on Postgres (not the in-memory store) for multi-instance safety.

## Compliance / trust
- [ ] Mandatory "unofficial, not endorsed by Supercell" disclaimer on every surface (verified).
- [ ] Human-in-the-loop on all paid human-tier reports (compliance requirement, ADR-0005).
- [ ] GDPR/KVKK: consent banner live, EU data region, DPA/sub-processor list published, erasure path tested, PII kept out of analytics + logs.
- [ ] Terms, privacy policy, refund policy published; pricing + fulfillment expectations clear.

## Growth readiness
- [ ] Funnel analytics firing (teaser→paid measurable); experiment assignment + exposure working.
- [ ] Referral codes + share cards working with attribution; lifecycle emails sending (or consciously deferred).
- [ ] SEO: sitemap/robots live, programmatic guides indexable, canonical URLs correct.

## Operational readiness
- [ ] On-call + incident response (`docs/operations/INCIDENT_RESPONSE.md`) staffed.
- [ ] Backups + a tested restore (`docs/operations/BACKUP_AND_DR.md`); RTO/RPO accepted.
- [ ] Budget alerts on Anthropic + Stripe + infra; dispute/refund monitoring (target dispute rate < 5%).
- [ ] Rollback rehearsed.

## Launch
- [ ] Soft-launch to a small cohort; watch **teaser→paid** + **CSAT/dispute** (the two metrics that decide the model) before scaling traffic.
