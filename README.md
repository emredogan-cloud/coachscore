# CoachScore

> Productized **"rate my account + upgrade roadmap"** for Clash of Clans — a
> scored account grade plus a prioritized, goal-aware upgrade roadmap.
> AI-drafted, human-verified, sold as one-time coaching reports.

[![Validation](https://github.com/emredogan-cloud/coachscore/actions/workflows/validation.yml/badge.svg)](https://github.com/emredogan-cloud/coachscore/actions/workflows/validation.yml)
[![Security](https://github.com/emredogan-cloud/coachscore/actions/workflows/security.yml/badge.svg)](https://github.com/emredogan-cloud/coachscore/actions/workflows/security.yml)
[![Quality](https://github.com/emredogan-cloud/coachscore/actions/workflows/quality.yml/badge.svg)](https://github.com/emredogan-cloud/coachscore/actions/workflows/quality.yml)

> **This material is unofficial and is not endorsed by Supercell.** Clash of
> Clans is a trademark of Supercell. This repository is a product, not legal
> advice — review Supercell's Terms of Service, Fan Content Policy, and
> developer API terms before monetizing.

---

## What this is

CoachScore turns the most-repeated free question in the Clash of Clans community
— *"rate my account / what should I upgrade next?"* — into a paid, one-time,
personalized report. A deterministic scoring engine grades the account across
seven dimensions; an LLM (Claude) drafts the diagnosis + roadmap from the exact
computed numbers; a vetted human coach verifies and signs off before delivery.

The full business and execution context lives in the source-of-truth documents
in the parent directory: `COACHSCORE_DEEP_DIVE_REPORT.md`,
`CLASH_OF_CLANS_MARKETPLACE_OPPORTUNITIES_REPORT.md`, and the strategy reports
(`GROWTH_STRATEGY.md`, `MONETIZATION_ANALYSIS.md`, `RISK_ANALYSIS.md`,
`TECH_DECISIONS.md`).

## Status

Built phase-by-phase. See `docs/EXECUTION_STATUS.md` for the live phase ledger.

| Phase | Scope | State |
|------|-------|-------|
| 0 | Foundation, CI/CD, ADRs, Game-Data Reference Table | ✅ implemented + green |
| 1 | Deterministic Scoring Engine (7 sub-scores, goal-aware, gap list) | ✅ implemented + green |
| 2 | AI pipeline (Claude) + schema validation + anti-hallucination + queue | ✅ implemented + green (live API verified) |
| 3 | Data intake (tag / screenshot / manual) + confidence routing | ⛔ gated on Supabase + R2 |
| 4 | Web product (teaser, score reveal, report, payments) | ⛔ gated on Stripe + Supabase |
| 5 | Coach marketplace | ⛔ gated on Stripe Connect |
| 6 | ReplayDoctor / BaseDoctor / WarPlan SKUs | ⛔ depends on P5 |
| 7 | Growth infra (analytics, experiments, referrals, SEO) | ⛔ gated on PostHog |
| 8 | Optimization (perf, cost, caching, observability) | ⛔ depends on P2–P7 |
| 9 | Production readiness review | ⛔ depends on all |

Phases 2+ require third-party credentials (see `.env.example`); they are
implemented behind interfaces where the logic is secret-free and gate cleanly on
the missing credential, per the autonomous-execution stopping rule.

## Tech stack

- **Frontend/Backend:** Next.js 15 (App Router) + TypeScript (strict) + Tailwind, as a PWA
- **Scoring engine:** pure, deterministic TypeScript (`lib/core`) — no I/O, no AI
- **Game data:** versioned reference table (`lib/game-data`) — patch-robust
- **AI (Phase 2):** Anthropic Claude — Opus (reasoning) + Haiku (extraction), schema-guarded
- **Data (Phase 3):** PostgreSQL via Supabase + Drizzle ORM; Cloudflare R2 storage
- **Payments (Phase 4):** Stripe (Connect for payouts later)
- **Analytics (Phase 7):** PostHog + Plausible
- **Hosting:** Vercel

See `docs/adr/` for the reasoning behind each decision.

## Getting started

```bash
# Requires Node >= 20.11 and pnpm 10+
pnpm install
cp .env.example .env.local   # fill in as phases require; Phase 0/1 need no secrets

pnpm dev                     # http://localhost:3000
```

## Development commands

```bash
pnpm validate            # format:check + lint + typecheck + test  (the local gate)
pnpm test                # run unit tests
pnpm test:coverage       # tests + coverage thresholds (90% lines/stmts/funcs, 80% branch)
pnpm typecheck           # tsc --noEmit (strict)
pnpm lint                # eslint . (Next + typescript-eslint rules)
pnpm format              # prettier --write
pnpm build               # next build (type-checked)
pnpm validate:reference  # patch-watcher: validate the Game-Data Reference Table
```

## Repository layout

```
app/                 Next.js App Router (UI + API routes)
components/          Shared React components (incl. the mandatory disclaimer)
lib/
  core/              Pure, deterministic scoring engine + grade scale
  game-data/         Versioned Game-Data Reference Table + validator
  env.ts             Typed, lazy environment access
docs/
  architecture/      System overview
  adr/               Architecture Decision Records
scripts/             Operational scripts (reference-table patch-watcher)
tests/               Unit / golden / property tests
.github/workflows/   CI/CD: validation, security, quality, production-build
```

## Quality bar

Every change must pass: Prettier, ESLint (`--max-warnings=0`), `tsc` strict,
Vitest with coverage thresholds, the reference-table validator, and `next build`.
CI enforces all of these on every PR; green CI is a hard merge gate.

## License

UNLICENSED — proprietary. All rights reserved.
