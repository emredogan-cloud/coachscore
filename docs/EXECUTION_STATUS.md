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
| 3 | Data Intake (tag / screenshot / manual + confidence) | ⛔ gated | Supabase + R2 |
| 4 | Web Product (onboarding, teaser, score reveal, report, payments) | ⛔ gated | Stripe + Supabase + Resend |
| 5 | Coach Marketplace Infrastructure | ⛔ gated | Stripe Connect (+ Wise/Payoneer) |
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

## Credential gate (why phases 3+ stop here)

Phases 3+ require live third-party services with no keys present
(Supabase, Cloudflare R2, Stripe, PostHog, Resend). Their secret-free logic can
still be implemented and unit-tested behind interfaces; live wiring resumes the
moment the corresponding credential is provided.
