# CoachScore — Final End-to-End Audit (Phases 0 → 7)

**Method:** the **repository + git history are the source of truth**, reconciled against the markdown docs. Two doc snapshots disagree on completion — the older reports (`CURRENT_PROJECT_STATUS_REPORT.md`, `FINAL_EXECUTION_REPORT.md`, dated 2026-06-17/23) predate PRs #11–#15 and say "P3–P7 = no code / ~28%". Git refutes that: `main` carries `72a75dd` (P3), `4fbcfd3` (P4), `7adefeb` (P5), `7cb0b38` (P6), and the Phase-7 PR (#15). 30 `lib/` modules, ~27 API routes, 10 migrations (`0000`–`0009`), 418 passing tests. Where a claim below isn't obvious, it was re-verified against code this audit.

**One-line verdict:** an unusually disciplined, well-tested **codebase** for Phases 0–7 — but **nothing is activated, paid generation is blocked by a real data-verification task, and runtime auth/ownership is unproven.** It is *not* launch-ready, and the gap is bigger than "just add credentials."

---

## 1. Honest completion

Avoid a single inflated number; the split matters:

| Dimension | Status |
|---|---|
| **Phases coded (0–7 of 0–9)** | ~80% of planned phases have code on `main`, CI-green. |
| **Activated in production** | **0%.** No live DB, auth, payments, email, storage, or analytics. `ANTHROPIC_API_KEY` is the only credential the build assumes. |
| **Paid revenue path runnable today** | **No** — blocked by reference-data verification debt (below), independent of credentials. |
| **Phases 8–9** | **Not started.** |
| **Net launch-readiness** | **Low.** Credentials + a data task + auth wiring + observability all stand between "CI-green" and "a stranger can pay and get a correct report." |

A fair characterization: **the build is ~75–80% code-complete through the Growth phase and ~0% live.** Quality of what exists is high; remaining work is concentrated in activation, data, and the runtime-integration story that unit tests structurally cannot cover.

---

## 2. Per-phase findings

- **P0 Foundation** ✅ — Next.js 15 strict TS, Tailwind, 6 ADRs, 4 CI workflows, versioned game-data reference table + validator, mandatory Supercell disclaimer, security headers. **Debt:** "PWA" is aspirational — `public/` is empty, **no manifest, no service worker** (verified). No Sentry/uptime despite the roadmap calling them P0.
- **P1 Scoring engine** ✅ — pure/deterministic 7 sub-scores, goal profiles, grades, cost-weighted gap list; golden + property tests. Logic is excellent; **starved of data** (see §5.1/§5.2).
- **P2 AI pipeline** ✅ — real Anthropic (Opus/Haiku) behind an interface, forced-tool schema validation, anti-hallucination (narrate-don't-compute), confidence + human-review flag, prompt-injection defense, in-house durable queue. **Debt:** queue store is an **in-memory `Map`** (jobs lost on restart, not multi-instance safe — verified); **no prompt-caching / rate-limit / timeout / cost controls** around live calls (the roadmap calls caching "the single biggest cost lever"); provider exercised by exactly one live test.
- **P3 Data intake** 🟡 — manual (credential-free) + screenshot-OCR + tag-adapter; immutable sha256 snapshots; 8 tables + RLS. **Debt:** **identity is an anonymous stub** (`persist.ts`); no real CoC API call exists; persistence/RLS **never run against a live DB**.
- **P4 Web product** 🟡 — deterministic RenderableReport + teaser + PDF (pdf-lib) + share/OG + pricing + Stripe (fetch adapter, HMAC webhook verify, order state machine, entitlements) + Resend email. Report/teaser/PDF/pricing work credential-free. **Debt:** checkout/webhook/email gated; entitlement gating needs Stripe+DB+Auth; refund-by-payment-intent acknowledged not handled.
- **P5 Coach marketplace** 🟡 — FSM-backed lifecycles, Bayesian reputation, 60/40 economics, full review/moderation/dispute/ratings service, Stripe Connect payouts (gated). **Debt:** all writes gated on DB+Auth; **Wise/Payoneer fallback not built**; coach-role promotion on approval not wired.
- **P6 Additional SKUs** 🟡 — ReplayDoctor/BaseDoctor/WarPlan, uniform report view, reuse of P2 AI + P4 payments + P5 review. **Debt:** **ReplayDoctor video pipeline (R2 upload/annotation) NOT built** — v1 is text-only; WarPlan is thin; webhook product-fulfillment is the one un-exercisable step without Stripe.
- **P7 Growth** 🟡 (this PR) — analytics (taxonomy + funnels + PII scrub + PostHog/no-op sinks), deterministic experiments + flags, creator-code referrals, viral share + UTM, SEO (metadata + JSON-LD + sitemap/robots + programmatic per-TH guides), lifecycle rules engine, growth dashboard. **Debt:** PostHog forwarding / persistence / lifecycle delivery / referral-and-dashboard auth all gated; the lifecycle **email deliverer adapter is not wired** (interface + service tested, no concrete sender); experiments are in-code only (not yet reconciled with live PostHog).

---

## 3. Architecture — strong

Single Next.js app (ADR-0002), pure engine with injected reference data (ADR-0003), versioned data-as-rows (ADR-0004), AI-drafted/human-verified with hard anti-hallucination guardrails (ADR-0005), web-first + compliance (ADR-0006). The repository pattern (interfaces + in-memory + Drizzle), the injectable-deps handler pattern, and the consistent `*-wire.ts` activation seams are applied uniformly across all 7 phases. Deny-by-default RLS mirrors app-layer authz. **This is the codebase's biggest strength** — it is coherent, idiomatic, and extends predictably.

Minor smells: the `Repositories` aggregate is now 27 repos on one interface (fine, but a growing god-interface); the anonymous-identity stub is copy-pasted into 4 wire files (centralize when Auth lands); `lib/api` mixes thin handlers with a growing set of `resolve*` wire helpers.

## 4. Code quality — high

Strict TS (`noUncheckedIndexedAccess`), 90/80 coverage **enforced in CI**, `--max-warnings=0` lint, Prettier gate, Semgrep + `pnpm audit` + secret scan, no-focused-test guard. 418 tests across golden/property/unit/route/component. The deliberate **exclusion of every network/DB boundary from coverage with written justification** is honest and correct. **Weakness:** coverage is unit-deep but **integration-shallow** — there are **no live-DB tests and no e2e/browser tests**; every excluded I/O file is untested against its real dependency. High line coverage here does **not** imply the system works end-to-end once wired.

## 5. Technical debt (ranked by launch impact)

1. **Reference-data verification debt — hard paid-path blocker (NOT a credential).** `assertPaidReportAllowed(townHall)` throws if that TH carries any `needsVerification` field; that debt spans TH11–18 (≈65 fields: heroes, equipment, categories), so **paid generation is effectively blocked across the board** until the values are verified against live game data. Pure data entry, but gating revenue. ADR-0004 forbids fabricating them.
2. **Placeholder per-element game-data tables.** Offense/Defense/Walls carry a single `representativeMaxLevel`, not the granular troop/spell/building/trap/wall tables the engine is designed to consume — so those sub-scores have little real data to run against. Described in-repo as "bigger than the 65 flags."
3. **Anonymous identity / Supabase Auth stub** in all 4 wire files — the entire ownership + RLS-at-runtime story is unproven; referral writes and the growth dashboard are dark until this is replaced.
4. **No durable queue backend** (in-memory `Map`) — not production-safe for the AI/PDF/lifecycle jobs.
5. **No live-DB / e2e tests** — RLS, migrations, and cross-tenant isolation have never executed.
6. **No observability** (zero Sentry/uptime refs) despite "non-negotiable from day one" in the roadmap.
7. **AI cost controls absent** — no prompt-caching, rate-limit, timeout, or budget guard on paid Anthropic calls.
8. **Unwired adapters:** lifecycle email deliverer, webhook product-fulfillment, coach-role promotion, refund reconciliation, Wise/Payoneer payouts, ReplayDoctor video pipeline.
9. **Stale env:** `INNGEST_*` is superseded (0 code refs) — should be removed from `.env.example`.

## 6. Security — solid posture, unproven at runtime

Deny-by-default RLS on every table; immutable snapshots; `FORCE ROW LEVEL SECURITY` on jobs/audit; HMAC webhook verification; prompt-injection defense; secret scanning + Semgrep + prod `pnpm audit` in CI; public-data-only CoC usage via fixed-IP proxy; PII kept out of analytics events (Phase 7 `stripPii`). **Caveats:** RLS is **defined but never executed** against Postgres — cross-tenant isolation must be tested before any paid flow (the repo's own `docs/db/RLS.md` says so). `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and must never reach the client. The single JSON-LD `dangerouslySetInnerHTML` (Phase 7) serializes only first-party data and is `nosemgrep`-annotated.

## 7. Scalability — adequate for early scale, with known cliffs

`account_snapshots` is the high-growth table (needs partitioning + GIN indexes — designed, not done). Scoring is cacheable by `(snapshotHash, goal, tableVersion)` — cache not implemented. Percentiles are meant to be materialized/cached off the request path — not implemented. The in-memory queue is the first thing that breaks under real concurrency/multi-instance. Analytics `analyticsEvents.list()` (Phase 7 dashboard) loads the whole table — fine early, needs aggregation/rollups at volume. None of these block an MVP; all are real at scale.

## 8. Missing systems

PWA manifest + service worker · observability (Sentry + uptime) · live Auth · durable queue backend · prompt-caching/cost controls · lifecycle delivery wiring · webhook product-fulfillment · refund reconciliation · ReplayDoctor video pipeline · Wise/Payoneer payouts · consent **record persistence** (Phase 7 banner is client-local only) · live PostHog↔in-code experiment reconciliation · Phase 8 (pgvector/data-moat) and Phase 9 (production hardening) entirely.

## 9. Activation blockers

**Credentials (light up code, no changes):** `DATABASE_URL` (+ Supabase) · R2 · Stripe (+ webhook secret) · Stripe Connect · Resend · PostHog · Plausible.
**Code/data blockers (credentials won't fix):** (a) reference-data verification — **the gating revenue blocker**; (b) Supabase Auth wiring (replace the stub); (c) durable queue; (d) observability; (e) the unwired adapters in §5.8; (f) live-DB + e2e test coverage before trusting RLS.

## 10. Production readiness — NOT ready

A user **cannot** today submit → score → pay → receive a correct report against real services: no DB/auth/payments/email are live, paid generation is data-blocked, and RLS is unproven. The *code paths* exist and are tested in isolation; the *system* has never run wired together.

## 11. Launch readiness — NO

Minimum path to a credible paid launch: (1) provision Supabase + R2 + Stripe + Resend; (2) **verify the reference data** (or restrict paid generation to fully-verified Town Halls); (3) wire Supabase Auth + run **cross-tenant RLS tests**; (4) durable queue + Sentry/uptime; (5) at least one true e2e purchase test against staging. Steps 2–3 are the long poles and are **not** credential work.

## 12. Remaining work for Phase 8 / 9

- **P8 (Optimization / data moat):** pgvector similarity (inside Supabase, no new vendor), prompt-cache + batch API for AI cost, scoring/percentile caches, snapshot partitioning + archival to R2, SEO ISR tuning.
- **P9 (Production readiness):** Auth hardening + RLS cross-tenant test suite, durable queue (QStash/Redis), Sentry + uptime + alerting, e2e/Playwright + live-DB integration suite, PWA manifest/service worker, refund reconciliation, data-residency/DPA finalization, load testing, runbooks.

---

### Bottom line
The engineering discipline here is real and rare for an AI-assisted build: clean architecture, enforced quality gates, honest credential-gating, no faked external calls. But "CI-green through Phase 7" is **not** "ready to take money." The three things standing between this repo and a trustworthy paid launch — **reference-data verification, live Auth + RLS proof, and end-to-end activation/observability** — are exactly the things unit tests and credential toggles cannot deliver. Treat Phases 8–9 (and the data task) as the real remaining product, not a victory lap.
