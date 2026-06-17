# 3. Pure, deterministic scoring engine with injected reference data

- **Status:** Accepted
- **Date:** 2026-06-17

## Context

The CoachScore scoring engine is the proprietary core. The product spec
(`COACHSCORE_DEEP_DIVE_REPORT.md` §7) requires it to be **objective and
reproducible** (same account → same score), **patch-robust**, **goal-aware**, and
**actionable** (decomposes into a gap list that drives the roadmap). Reports are
version-locked against frozen snapshots so disputes are adjudicable on facts —
this is only possible if scoring is perfectly reproducible.

## Decision

The scoring engine (`lib/core`) is a **pure, deterministic, side-effect-free**
TypeScript module:

- No I/O, no clock (`Date.now`), no randomness inside the engine.
- TH-relative maxima and weights are **injected** as parameters (dependency
  injection), not imported from a global — so tests pass known fixtures and the
  engine never depends on the reference table's completeness to be correct.
- Output is a function of `(normalizedAccount, goal, scoringReference)` only.
- Results are cacheable by `(snapshotHash, goal, referenceTableVersion)`.

Correctness is locked by **golden tests** reproducing the deep-dive's worked
examples and **property tests** (scores ∈ [0,100], weights sum to 1,
determinism over many runs).

## Consequences

- Reproducibility → cacheable, free re-analysis, adjudicable disputes.
- The engine is trivially unit-testable and extractable (see ADR 0002).
- Reference-table accuracy is a *separate* concern (ADR 0004), decoupled from
  engine correctness.
- Discipline required: contributors must not introduce I/O or nondeterminism
  into `lib/core`; enforced by review and the purity of its imports.

## Alternatives considered

- **AI-computed scores:** rejected — non-reproducible, unauditable, and would let
  the model invent numbers (violates the anti-hallucination rule, ADR 0005).
- **Globally imported reference table inside the engine:** rejected — couples
  engine correctness to data completeness and makes fixtures awkward.
