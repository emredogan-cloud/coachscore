# 1. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-06-17

## Context

CoachScore is built phase-by-phase, partly by autonomous agents. Decisions made
in early phases (data model, scoring determinism, AI guardrails) constrain every
later phase. We need a durable, reviewable record of *why* each significant
choice was made, so future contributors (human or agent) don't re-litigate or
silently contradict settled decisions.

## Decision

We record architecture decisions as ADRs (Architecture Decision Records) in
`docs/adr`, numbered sequentially, using a lightweight format: Context,
Decision, Consequences, and Alternatives considered. One ADR per significant,
hard-to-reverse decision. ADRs are append-only; a superseded decision gets a new
ADR that references the old one rather than editing history.

## Consequences

- Every significant decision is greppable and linked from code comments.
- PRs that change architecture must add or supersede an ADR.
- Slight overhead per decision; acceptable for the durability it buys.

## Alternatives considered

- **Decisions in a wiki / Notion:** drifts from the code, not versioned with it.
- **Only commit messages:** too granular and not discoverable.
