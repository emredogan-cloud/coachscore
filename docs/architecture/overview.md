# Architecture Overview

CoachScore is a single Next.js application (ADR 0002) deployed as a mobile-first
PWA. This document is the map; the reasoning behind each decision lives in
`docs/adr/`.

## High-level flow (target state)

```
PWA (Next.js)
  → intake (tag / screenshot / manual)            [Phase 3]
  → extraction + normalization                    [Phase 3; Haiku OCR in Phase 2]
  → frozen account snapshot                        [Phase 3]
  → deterministic scoring engine (lib/core)        [Phase 1 ✅]
        reads TH-relative maxima from lib/game-data [Phase 0 ✅]
  → free teaser (instant, $0 marginal cost)        [Phase 4]
  → paid order (Stripe)                            [Phase 4]
  → AI draft (Claude Opus, schema-guarded)         [Phase 2]
  → human coach review + version-lock              [Phase 4 founder / Phase 5 coaches]
  → report assembly (web + PDF + share card)       [Phase 4]
  → delivery + saved account + lifecycle re-engage [Phase 4 / Phase 7]
```

## Layers implemented today (Phases 0–1)

### `lib/game-data` — Game-Data Reference Table (ADR 0004)

The versioned source of TH-relative maxima (TH11–18): hero caps + relative DE
cost weights, equipment availability, and category caps. Every value carries a
`needsVerification` flag; only source-confirmed values are marked verified.
`validateReferenceTable()` enforces structural invariants and tallies
verification debt. `scripts/validate-reference-table.ts` is the patch-watcher,
run in CI and after every Supercell patch.

### `lib/core` — Scoring engine (ADR 0003)

Pure, deterministic, side-effect-free. Computes the seven sub-scores (Heroes,
Offense, Defense, Equipment, Progression/Rush, Walls, Clan Value), the goal-aware
composite, the letter grade, and the cost-weighted gap list that seeds the
roadmap. Reference data is **injected**, so the engine is testable in isolation
and reproducible (same input → same output), which is what makes cached
re-analysis and version-locked, adjudicable reports possible.

## Cross-cutting concerns

- **Compliance (ADR 0006):** mandatory Supercell disclaimer on every surface;
  web-first to avoid the app-store tax; CoC API is one of three intake paths.
- **Anti-hallucination (ADR 0005):** the engine produces all numbers; the AI
  (Phase 2) only narrates them, against schema validation.
- **Security:** strict CSP-adjacent headers in `next.config.mjs`; secrets are
  never committed; typed lazy env access fails loudly per-feature.
- **Observability/CI:** four workflows (validation, security, quality,
  production-build) gate every change.

## Data & determinism contract

The scoring engine's output is a pure function of
`(normalizedAccount, goal, scoringReference)`. No clock, no randomness, no I/O.
This contract is enforced by golden tests (reproducing the deep-dive worked
examples) and property tests (range, weight-sum, determinism). Any violation is a
bug, not a feature.
