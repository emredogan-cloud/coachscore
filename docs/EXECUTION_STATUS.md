# Execution Status

Live ledger of the phased build. Updated as each phase merges. The phase
definitions come from the master execution prompt; gating conditions come from
`.env.example` (which credential each phase needs).

## Legend

- ✅ **done** — implemented, tested, and merged green
- 🟡 **partial** — secret-free logic implemented + tested; live integration gated
- ⛔ **gated** — blocked on a credential or a prior phase
- ⬜ **not started**

## Ledger

| Phase | Title | State | Gate |
|------|-------|-------|------|
| 0 | Foundation (repo, CI/CD, ADRs, Game-Data Reference Table) | ✅ done | — |
| 1 | Deterministic Scoring Engine | ✅ done | — |
| 2 | AI Pipeline (Claude) + schema validation + anti-hallucination | ✅ done | — (real `ANTHROPIC_API_KEY` available) |
| 3 | Data Intake (tag / screenshot / manual) + DB / snapshots / storage / auth+RLS | 🟡 implemented, not activated | Supabase + R2 (activation only) |
| 4 | Web Product (onboarding, teaser, full report, PDF, share, pricing, payments, email) | 🟡 implemented, not activated | Stripe + Resend (activation only) |
| 5 | Coach Marketplace (onboarding, review/moderation, ratings, disputes, payouts, admin) | 🟡 implemented, not activated | Supabase + Stripe Connect (activation only) |
| 6 | Additional SKUs (ReplayDoctor, BaseDoctor, WarPlan) | ⛔ gated | depends on P5 |
| 7 | Growth Infrastructure (analytics, experiments, referrals, SEO) | ⛔ gated | PostHog |
| 8 | Optimization (perf, cost, caching, observability) | ⛔ gated | depends on P2–P7 |
| 9 | Production Readiness review | ⛔ gated | depends on all |

## Phase 0 — Foundation ✅

- Next.js 15 (App Router) + TypeScript strict + Tailwind PWA scaffold.
- Versioned **Game-Data Reference Table** (TH11–18) with a validator + patch
  watcher; source-verified values vs. flagged verification debt (ADR 0004).
- Four CI/CD workflows: validation, security, quality, production-build.
- Six ADRs; README; architecture overview; `.env.example`; Dependabot; PR template.
- Local gates green: format, lint (`--max-warnings=0`), typecheck (strict),
  tests + coverage, reference validation, build.

## Phase 1 — Deterministic Scoring Engine ✅

- Seven sub-scores (Heroes, Offense, Defense, Equipment, Progression/Rush,
  Walls, Clan Value), goal-aware weight profiles, composite, grade, and the
  cost-weighted gap list (deep-dive §7).
- Pure + deterministic (ADR 0003); reference data injected.
- **Golden tests** reproduce the deep-dive worked examples (TH13 HeroScore ≈ 76;
  TH14 war-goal composite ≈ 85 / Grade A). **Property tests** assert range,
  weight-sum, and determinism.

## Phase 2 — AI Pipeline ✅

- Real Anthropic provider behind a swappable interface (Opus reasoning + Haiku
  extraction); forced tool use → JSON-Schema-validated structured output.
- Anti-hallucination (ADR 0005): the roadmap is verified against the engine's
  gap list (exact element ids + from/to levels); the model cannot invent stats.
- Confidence scoring + low-confidence → human-review flag; prompt-injection
  defense (untrusted user text wrapped as data, never instructions).
- Curated, versioned knowledge base injected at inference.
- OCR/extraction (vision) with per-field confidence routing.
- Durable queue runner: idempotency + bounded retries + backoff + dead-letter
  (transport-agnostic; in-memory store now, Redis/Postgres later).
- Reference-data readiness gate isolates `needsVerification` data from PAID
  generation (`assertPaidReportAllowed`).
- 92 unit tests (no API) + a **live integration test** that hits the real
  Anthropic API (run via `pnpm test:integration`; self-skips without a key, so
  public CI stays green without putting a paid key in a public repo).

## Phase 3 — Data Intake 🟡 (implemented, not activated)

- Three intake paths converging on the engine's `NormalizedAccount`:
  **manual** (works today, no credential), **screenshot** (wraps Phase-2 OCR →
  correction → confidence routing; needs `ANTHROPIC_API_KEY`), **tag**
  (CoC API adapter interface + `NotConfigured` default; needs the proxy).
- **Immutable, version-locked snapshots** (`lib/snapshot`): canonical sha256
  hash over (account, goal, engine/reference/KB versions); the engine consumes
  snapshots via `scoreSnapshot`.
- **Database layer** (`lib/db`): Drizzle schema for users, accounts,
  account_snapshots, reports, report_drafts, uploads, jobs, audit_logs; SQL
  migrations generated offline; repositories (in-memory + Drizzle) behind
  interfaces; a `PersistenceService` with auth + audit logging.
- **Deny-by-default RLS** SQL (`lib/db/migrations/0001_rls_policies.sql`,
  docs/db/RLS.md) mirroring `lib/auth` roles/permissions.
- **Storage** (`lib/storage`): adapter interface + in-memory local adapter +
  env-gated R2 adapter (injected S3-like client, not activated).
- **API surface**: `/api/intake/{manual,tag,screenshot}` routes + server
  actions; scoring runs with no credentials, persistence is attempted only when
  the database is activated (otherwise reported as `database_not_configured`).
- **UI**: `/intake` three-path wizard (manual form, screenshot upload,
  confidence-correction, review screen), feature-gated by activation status.
- 105 new unit/route/component tests; coverage thresholds held; CI green.
- **Activation only**: provide Supabase (`DATABASE_URL` + keys) and R2 creds,
  run `drizzle-kit migrate` (schema + RLS), and wire Supabase Auth identity.

## Phase 4 — Web Product 🟡 (implemented, not activated)

- **Report experience** (`lib/report`): deterministic `RenderableReport` assembly
  from snapshot + score (+ optional AI draft), strengths/weaknesses, teaser, and
  report version-locking.
- **PDF** (`lib/pdf`): deterministic, byte-stable report PDF via pdf-lib + a
  print-ready HTML renderer. Works with no credential.
- **Pricing** (`lib/pricing`): SKU catalog (free/basic/standard/pro/account_rescue/
  clan) + comparison matrix from the monetization model.
- **Payments** (`lib/payments`): `PaymentProvider` interface, HMAC webhook
  signature verification, order state machine, Stripe event→transition mapping,
  entitlement grant, checkout orchestration, Stripe adapter (fetch, gated), and a
  webhook handler that fulfills orders + grants entitlements.
- **Email** (`lib/email`): provider interface, transactional templates
  (report-ready, receipt), Resend adapter (fetch, gated), delivery pipeline with
  `email_deliveries` records.
- **Share** (`lib/share` + `app/api/share/og`): share-card data + an OG image route.
- **DB** (migration 0002 + RLS 0003): `orders`, `entitlements`, `email_deliveries`
  + repos + deny-by-default RLS.
- **API/UI**: `/api/{report,report/pdf,checkout,stripe/webhook,share/og}` + server
  actions; `/onboarding`, `/report` (teaser → full-report funnel), `/pricing`.
  Scoring/report/PDF/teaser are credential-free; checkout/webhook/email return
  `not_activated` until Stripe/Resend are provisioned.
- ~150 new tests; coverage thresholds held; CI green.
- **Activation only**: Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) and
  Resend (`RESEND_API_KEY`), plus the Phase-3 Supabase creds for persistence.

## Phase 5 — Coach Marketplace 🟡 (implemented, not activated)

- **Domain state machines** via a generic FSM helper (`lib/fsm`): coach status,
  application, review workflow, moderation, dispute (all pure + tested).
- **Coach domain** (`lib/coach`): specialties catalog, profile validation,
  Bayesian reputation scoring.
- **Economics** (`lib/economics`): 60/40 coach/platform split + earnings.
- **MarketplaceService** (`lib/marketplace`): coach onboarding (apply → approve
  → activate), the human-review workflow (assign/claim/release/start/submit/
  escalate), moderation (approve/request-revision/reject), ratings + reputation
  recompute, disputes — all with deny-by-default auth + audit + queued
  notifications.
- **Payouts** (`lib/payouts`): Stripe Connect provider interface + adapter
  (fetch, gated) + a payout service (onboarding, account-active, execute).
- **Notifications** (`lib/notifications`): templates + delivery (gated on Resend).
- **DB** (migration 0004 + RLS 0005): coaches, coach_applications,
  review_assignments, moderations, coach_ratings, payout_accounts, payouts,
  disputes, notifications + deny-by-default RLS; repos (in-memory + Drizzle).
- **API/UI**: `/api/{coach/apply,coach/rate,dispute}` + coach/admin server
  actions; `/coach` (apply), `/coach/dashboard`, `/admin`. All marketplace
  writes return `not_activated` until the database (+ Supabase Auth) exists.
- ~70 new tests; coverage thresholds held; CI green.
- **Activation only**: Supabase (Phase 3) for persistence + Stripe (Connect) for
  payouts.

## Credential gate (why phases 6+ stop here)

Phases 6+ require live third-party services with no keys present plus the
Phase-3/4/5 activation creds (Supabase, R2, Stripe, Resend). Their secret-free
logic can still be implemented and unit-tested behind interfaces; live wiring
resumes the moment the corresponding credential is provided.
