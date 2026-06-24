# PAYMENTS DECISION RECORD — CoachScore

**Date:** 2026-06-24 · **Sprint:** Final Production Hardening (Phase B)
**Status:** RECOMMENDED — adopt **LemonSqueezy** as the primary customer-billing provider.

---

## Decision (TL;DR)

**Use LemonSqueezy for customer billing. Do not put Stripe on the customer-billing path.** Keep a **separate payout rail** (Stripe Connect / Wise / Payoneer) for the coach-marketplace payouts *only when that feature activates* — it is a payout problem, not a billing problem, and must not drag Stripe onto the buyer's checkout.

The decisive technical reason is **Merchant of Record (MoR)**: LemonSqueezy becomes the legal seller and handles **global VAT / sales tax / GST** registration, collection, remittance, and invoicing. For a **solo operator selling one-time digital products to a global audience** (the CoC player base skews TR/ID/IN, revenue US/DE per the growth docs), that removes the single largest non-product burden — tax compliance across dozens of jurisdictions — which Stripe leaves to you.

---

## Context (verified from the codebase)

- **Business model:** CoachScore sells **one-time digital reports** — the main full report and three SKUs (`replay_doctor` $9, `base_doctor` $9, `war_plan` $7; `lib/products/catalog.ts`). The roadmap is explicit: *one-time, no subscription*. There is **no recurring-billing requirement today**.
- **Current code:** `lib/payments` is a clean abstraction — a `PaymentProvider` interface (`createCheckoutSession`) with a `StripePaymentProvider`, a `NotConfiguredPaymentProvider` (throws without keys), an order state machine, signed-webhook verification (`signature.ts`), and event mapping (`events.ts`). **There is no Stripe SDK dependency** — the adapter calls Stripe over raw HTTPS. Stripe is currently **unconfigured** (`STRIPE_SECRET_KEY` empty).
- **Implication:** swapping providers is low-friction. A `LemonSqueezyPaymentProvider` implements the same one-method interface (return a hosted-checkout URL); a `mapLemonSqueezyEvent` mirrors `mapStripeEvent`. No caller changes.

---

## Requirements analysis

The prompt's generic requirement list, mapped to **what CoachScore actually needs** and **whether LemonSqueezy satisfies it**:

| Requirement | CoachScore's real need | LemonSqueezy | Notes |
|---|---|---|---|
| **Subscriptions** | Not used today (one-time reports). Possible future "Pro". | ✅ Full subscriptions | Available if/when needed — no re-platforming |
| **Upgrades / downgrades** | N/A today | ✅ Plan changes + proration | Future-proof |
| **Customer portal** | Low need (one-time) | ✅ Hosted customer portal | Manage/cancel/invoices, zero build |
| **Webhooks** | **Yes** — fulfill the report on payment | ✅ Signed webhooks (HMAC) | Maps to existing `signature.ts` + order FSM |
| **Affiliate / referral** | **Yes** — creator-code growth loop (`lib/referrals`) | ✅ Built-in affiliate program | Native affiliates replace/augment custom referral payouts |
| **VAT handling** | **Critical** — global buyers, solo seller | ✅ **MoR: LS handles VAT/GST/sales-tax end-to-end** | The decisive factor |
| **Receipts** | **Yes** | ✅ Branded invoices/receipts auto-sent | Zero build |
| **Refunds** | **Yes** (`lib/disputes`) | ✅ Refunds via dashboard + API + webhook | Maps to dispute flow |

**Every requirement is satisfied.** The ones CoachScore actually depends on today — webhooks, receipts, refunds, affiliate, and above all **VAT/MoR** — are LemonSqueezy's core strengths.

---

## Why Merchant of Record is the deciding factor

With **Stripe**, *you* are the merchant. You must determine tax nexus, register for VAT/GST in each jurisdiction (EU VAT-OSS, UK, etc.), collect the right rate, file and remit, and issue compliant invoices. Stripe Tax computes rates but **does not become the seller of record** — the legal and filing burden stays with you. For a one-person company that is a serious, ongoing liability.

With **LemonSqueezy (MoR)**, LemonSqueezy is the seller of record. It collects and remits tax worldwide, issues compliant invoices, and absorbs fraud/chargeback handling. You receive a single payout. **This is the right trade for a solo operator selling digital goods globally**, and it is the reason to prefer it even though its per-transaction fee is higher than raw Stripe — the fee buys away the compliance cost.

---

## When would Stripe still be necessary? (honest)

One real case: **coach-marketplace payouts.** When the marketplace activates, money must flow to third-party coaches (split/destination payments). LemonSqueezy is MoR for *selling* — it does **not** do arbitrary third-party payouts. That needs **Stripe Connect** (the existing `STRIPE_CONNECT_CLIENT_ID` / `lib/payouts/connect-adapter.ts`) **or** Wise/Payoneer (already anticipated in the roadmap).

**This does not change the billing decision.** Customer billing → LemonSqueezy. Coach payouts → a dedicated payout rail, added only when the marketplace goes live. Keeping them separate is cleaner than forcing Stripe onto every buyer's checkout to serve a not-yet-live payout feature.

**Conclusion:** there is **no technical reason to use Stripe for customer billing**. Recommend LemonSqueezy.

---

## Required environment variables

```env
# LemonSqueezy — primary customer billing (Merchant of Record)
LEMONSQUEEZY_API_KEY=            # API key (server-only)
LEMONSQUEEZY_STORE_ID=           # numeric store id
LEMONSQUEEZY_WEBHOOK_SECRET=     # signing secret for webhook HMAC verification
# One variant id per purchasable SKU (CoachScore is one-time products, not tiers):
LEMONSQUEEZY_VARIANT_STANDARD=        # main full report
LEMONSQUEEZY_VARIANT_REPLAY_DOCTOR=   # ReplayDoctor
LEMONSQUEEZY_VARIANT_BASE_DOCTOR=     # BaseDoctor
LEMONSQUEEZY_VARIANT_WAR_PLAN=        # WarPlan
```

Notes on the prompt's suggested keys: CoachScore has **no basic/standard/pro subscription tiers**, so `*_VARIANT_BASIC/STANDARD/PRO` are remapped to the **actual one-time SKUs** above. Hosted-checkout URLs are derived from the variant ids via the API, so explicit `*_CHECKOUT_URL_*` keys are **not required** (you can add them if you prefer pre-generated buy-links). `NEXT_PUBLIC_*` is not needed — LemonSqueezy checkout is hosted/overlay, so no publishable client key is exposed.

These have been added to `.env.example` (the `STRIPE_*` customer keys are marked legacy/superseded; `STRIPE_CONNECT_CLIENT_ID` is retained for the future payout rail).

---

## Implementation path (small, behind the existing interface)

1. Add `lib/payments/lemonsqueezy-adapter.ts` implementing `PaymentProvider.createCheckoutSession` → create a LemonSqueezy checkout for the SKU's variant, return `{ sessionId, url }`. Mirror the `NotConfigured` guard (no key → throws, never fakes).
2. Add `mapLemonSqueezyEvent` (parallel to `mapStripeEvent`) for `order_created` / `order_refunded` → the existing `OrderEventKind` + order FSM.
3. Add `verifyLemonSqueezyWebhook` (HMAC-SHA256 over the raw body with `LEMONSQUEEZY_WEBHOOK_SECRET`) — `signature.ts` already has the HMAC primitive.
4. Point the checkout factory at the LemonSqueezy provider when its keys are present (keep Stripe selectable for the payout-only path).
5. Tests: provider returns a URL; `NotConfigured` throws; webhook signature verify; event mapping. (Live calls remain gated on real keys — no fabrication.)

**Scope:** ~1 adapter + 1 event map + 1 verify fn + tests. No caller or UI changes (the buy button already calls the abstraction). **This record is the decision; the adapter implementation is a follow-up task — flagged, not silently done, because it should ship with live LemonSqueezy keys to be verifiable end-to-end.**

---

## Verdict

**Adopt LemonSqueezy as the primary billing provider.** It satisfies every stated requirement, and its Merchant-of-Record tax handling is the right architectural choice for a solo operator selling one-time digital products globally. Stripe is not needed for customer billing; reserve a dedicated payout rail for coach-marketplace payouts when that feature activates.
