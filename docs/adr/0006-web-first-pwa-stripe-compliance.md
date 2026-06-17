# 6. Web-first PWA, Stripe payments, and ToS-compliance posture

- **Status:** Accepted
- **Date:** 2026-06-17

## Context

CoachScore monetizes Clash of Clans coaching. Two hard external constraints shape
the whole product (`TECH_DECISIONS.md`, `RISK_ANALYSIS.md` #2):

1. **App-store economics:** native apps take a 30% cut on digital goods and force
   IAP classification.
2. **Supercell Fan Content Policy:** monetization is permitted only through ads,
   donations, and **coaching**. The "unofficial, not endorsed by Supercell"
   disclaimer is mandatory; no Supercell trademark in domain/brand; the CoC API
   is non-commercial + IP-whitelisted and must never be the sole dependency.

## Decision

- Ship as a **mobile-first PWA** (Next.js), not native apps — avoids the
  app-store tax and the digital-goods/IAP classification entirely.
- Payments via **Stripe** (Checkout → Connect for coach payouts later;
  Payoneer/Wise fallback). No gambling/escrow/money-transmission/game-currency
  flows.
- The **mandatory disclaimer** is a first-class primitive (`components/disclaimer`,
  `SUPERCELL_DISCLAIMER` in `lib/env`) rendered on every page and embedded in
  every report/share-card.
- The CoC API (when used) is **one of three intake paths** (tag / screenshot /
  manual), public data only, via a fixed-IP compliant proxy — so a policy change
  degrades, never kills, the product.
- Permanent exclusions encoded as product rules: no account login/sharing, no
  automation/boosting, no selling gems/resources, no physical merch/NFTs.

## Consequences

- 100% of revenue minus Stripe fees (no 30% platform tax).
- The product stays inside the one blessed monetization channel.
- Resilience to CoC-API policy shifts by design.
- Security headers + PWA manifest are set in `next.config.mjs` / the root layout.

## Alternatives considered

- **Native iOS/Android apps:** 30% tax, review friction, IAP classification —
  rejected.
- **Sole reliance on the CoC API for intake:** fragile + gray-area — rejected in
  favor of the three-path design.
