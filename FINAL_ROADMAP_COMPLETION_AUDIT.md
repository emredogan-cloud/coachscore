# CoachScore — Final Roadmap Completion Audit (Phases 0 → 9)

**Method:** repository + git history are the source of truth. Verified this audit against code: 34 `lib/` modules, 20 API routes, 11 migrations (`0000`–`0010`), **485 tests / 82 files**, CI-green on `main` through Phase 8 (`4ad113b`) with Phase 9 in PR #17. No numbers below are inflated; where Phases 8–9 changed a Phase-7 finding, it is marked.

**One-line verdict:** the *build* is now genuinely comprehensive and disciplined across all ten phases — but **it is still not activated, the paid path is still data-blocked, and runtime auth/RLS is still unproven.** Phases 8–9 built the production *machinery* (cost controls, durable queue, observability, security, PWA, E2E harness, ops docs); they did not — and without credentials/data could not — cross the launch line.

---

## Completion percentages (honest)

| Dimension | % | Basis |
|---|---:|---|
| **Code/build completeness (P0–P9)** | **~90%** | All ten phases have substantial, tested, CI-green code. The missing ~10% is work that genuinely cannot be finished here: per-element game-data tables (data), the Sentry/Resend-lifecycle concrete adapters (creds+deps), and live-integration proof. |
| **Activated in production** | **~5%** | Only credential-free paths run: deterministic scoring, the free teaser, SEO/guide pages, analytics no-op sink. Everything needing a service (DB, Auth, Stripe, Resend, R2, PostHog, Sentry) is dark. |
| **Launch-ready (can take money safely)** | **No** | Three long poles remain (below); none are closed. |
| **Phases by scope** | **10/10 built, 0/10 fully activated** | — |

A blunt framing: **~90% built, ~5% live, 0% revenue-capable today.** The gap between "CI-green" and "a stranger pays and gets a correct, owned, observable report" is the entire remaining product risk.

---

## Scores (0–100, brutally honest)

### Architecture — 92
Exceptional and rare for an AI-assisted build. Single Next app (ADR-0002), pure injected-reference engine (ADR-0003), data-as-rows (ADR-0004), AI-drafted/human-verified guardrails (ADR-0005), every external service behind an interface + adapter, uniform repository/handler/`*-wire` seams across 34 modules, deny-by-default RLS mirrored in app authz. Phase 8–9 extended the same patterns cleanly (async queue store, cache/retrieval/observability/security all interface-first). Deductions: the `Repositories` aggregate is now a 27-method god-interface; 34 lib modules is a lot of surface for a pre-launch product; several "abstraction + gated adapter" pairs add indirection that is unproven until activation.

### Code quality — 90
Strict TS (`noUncheckedIndexedAccess`), **90/80 coverage enforced in CI** (actual 95.67/88.68), lint `--max-warnings=0`, Prettier gate, Semgrep + `pnpm audit` + secret scan, 485 tests (golden/property/unit/route/component + a static RLS-coverage guard). Deductions: coverage is **unit-deep, integration-shallow** — every network/DB boundary is excluded-with-justification and *never executed against its real dependency*; the live E2E/RLS/webhook suites exist but are gated and have **never run green** (no live DB/server). High coverage here does not prove the wired system works.

### Security — 70
Strong design: deny-by-default RLS on every sensitive table (now **statically guarded** by a test that fails if a table lacks RLS), `FORCE RLS` on jobs/audit, immutable snapshots, HMAC webhook verification, prompt-injection defense, PII redaction in logs + analytics, rate-limiter + fraud + disposable-email primitives, secret scanning in CI. Deductions (all runtime-unproven): **RLS is never enforced at runtime** because identity is still the anonymous stub — the static guard proves policies *exist*, not that they *deny*; Sentry not wired; the rate-limiter/fraud primitives are **built but not yet attached to any route**; no live pen-test or cross-tenant proof. Design ~90, runtime ~50 → **70**.

### Production readiness — 38
All the scaffolding now exists: `/api/health` activation matrix + `/admin/health`, structured logging + error/alert/heartbeat abstractions, durable queue with DLQ, performance caches, AI cost/budget controls, PWA, backup/DR + incident + deployment-checklist docs. But **0% is activated**, the **paid path is data-blocked**, **Auth is not live** (so RLS + ownership are unproven), no live integration has run, and the Sentry/lifecycle-email concrete adapters are not wired. The capability to *become* production-ready is largely built; the activation, data, and proof are not. **38** reflects "scaffolding done, none of it proven in production."

---

## Remaining blockers (ranked)

1. **Reference-data verification — #1 revenue blocker, unchanged.** `assertPaidReportAllowed` still throws for any Town Hall with `needsVerification` debt (spans TH11–18). Paid generation is blocked across the board until the data is verified against live game data (or paid generation is restricted to verified THs). **A data task, not a credential, and Phases 8–9 did not touch it.**
2. **Nothing is activated.** No Supabase/Auth, Stripe, Resend, R2, PostHog, Sentry provisioned. Phases 7–9 *grew* the gated surface; activation work grew with it.
3. **Auth still anonymous.** Now centralized to one resolver (`lib/auth/identity.ts`) — good — but it still returns anon, so RLS/ownership remain unproven at runtime.
4. **No live integration has executed.** Durable `DrizzleQueueStore`, cross-tenant RLS enforcement, Playwright E2E, staging webhook — all gated, none run green. Browsers aren't even installed in CI.
5. **Per-element game-data tables are still placeholders** (Offense/Defense/Walls) — real sub-score fidelity is limited until they exist.
6. **Concrete adapters unwired:** Sentry (`@sentry/node` not added), lifecycle email deliverer (interface only), Redis/QStash queue transport (interface only), real semantic embeddings (hashing fallback only), Wise/Payoneer payouts, webhook product-fulfillment, ReplayDoctor video pipeline.

## Technical debt (current)
- Integration test gap (no live DB/e2e run) is now the single biggest quality risk.
- "Interface-with-gated-adapter" proliferation: many subsystems have a tested no-op/memory impl and an unproven real adapter — honest, but the real adapters are a cliff of untested code awaiting activation.
- `Repositories` god-interface; 34 lib modules; minor duplication in the `*-wire` resolvers.
- `INNGEST_*` env entries are superseded dead config (remove).
- Rate-limit/fraud primitives not yet attached to routes; consent record is client-local only (not persisted).

## Missing work for a real launch
Reference-data verification → wire Supabase Auth + **run** the cross-tenant RLS suite → provision Stripe/Resend/R2/PostHog → install Playwright browsers + run E2E + a real refunded purchase → add `@sentry/node` + heartbeat + alerts → durable queue on Postgres (not memory) → attach rate-limiting/fraud to public routes → burn down per-element game data. Then Phase-style hardening: load test, DR drill, DPA finalization.

## Bottom line
Across nine phases this became an unusually clean, well-tested, honestly-gated codebase — the engineering is real. But "comprehensive build" ≠ "launchable business." The decisive remaining work is exactly what code generation and credential toggles can't deliver: **verified game data, a live auth/RLS proof, and an end-to-end activated, observed purchase.** Treat those three — not more features — as the path to launch.
