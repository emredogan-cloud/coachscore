# 5. AI-drafted + human-verified, with hard anti-hallucination guardrails

- **Status:** Accepted (binding from Phase 2)
- **Date:** 2026-06-17

## Context

CoachScore's economics rest on AI drafting the diagnosis + roadmap (Opus) and
extraction (Haiku), with a human coach verifying before delivery. Quality is the
#1 operational risk (`RISK_ANALYSIS.md` #3): a hallucinated stat or wrong advice
poisons a fragile brand. The human-in-the-loop is also a **compliance**
requirement — it keeps the product inside Supercell's blessed "coaching" channel
rather than an automated API SaaS (`RISK_ANALYSIS.md` #2).

## Decision

When the AI pipeline lands (Phase 2), these guardrails are **non-negotiable**:

1. **The model never invents stats.** Exact computed values (scores, levels,
   caps, gaps) are injected from the deterministic engine; the model narrates
   them, it does not produce them.
2. **Schema-validated outputs.** Every AI response is validated against a Zod
   schema before assembly. On mismatch: regenerate (bounded retries), then flag
   for human review. Never ship an unvalidated payload.
3. **KB-grounded meta.** Current-meta advice comes from an injected, patch-updated
   knowledge base, not from training-data recall.
4. **Untrusted input is data, not instructions.** User free-text and screenshot
   contents are passed as clearly delimited data; prompt-injection defenses
   prevent them from altering system instructions.
5. **Low-confidence flagging.** The model flags uncertain recommendations for the
   human reviewer; the AI-only tier will not auto-ship low-confidence reports.
6. **Provider abstraction.** The AI provider sits behind an interface so models
   can be swapped without touching callers.

## Consequences

- Reports are accurate, auditable, and defensible in disputes.
- The same rule (no invented data) that protects quality also keeps the
  reference table honest (ADR 0004).
- Phase 2 cannot be marked complete without these guardrails + their tests.

## Alternatives considered

- **Fully automated, no human sign-off:** cheaper but moves outside the blessed
  channel and removes the quality backstop — rejected.
- **Trusting model recall for meta/stats:** stale + hallucination-prone — rejected.
