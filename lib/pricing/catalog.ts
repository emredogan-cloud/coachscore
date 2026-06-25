/**
 * SKU catalog (Phase 4) — prices + fulfillment from reports/MONETIZATION_ANALYSIS.md
 * (Free $0, Basic $7 instant-AI, Standard $12 human-reviewed [volume workhorse],
 * Pro $29 senior coach, AccountRescue $19, Clan $8/seat min 10). Blended AOV ~$11–13.
 */

import { SKU_IDS, type PricingTier, type SkuId } from './types';

export const PRICING_CATALOG: Readonly<Record<SkuId, PricingTier>> = {
  free: {
    id: 'free',
    name: 'Free Teaser',
    priceUsdCents: 0,
    currency: 'usd',
    fulfillment: 'free',
    blurb: 'Your overall score and biggest weakness, instantly and free.',
    features: [
      'Overall CoachScore + letter grade',
      'Your single biggest weakness',
      'No account required',
    ],
    highlighted: false,
    perSeat: false,
    purchasable: false,
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    priceUsdCents: 700,
    currency: 'usd',
    fulfillment: 'instant_ai',
    blurb: 'Instant, AI-generated full report. Fast and self-serve.',
    features: [
      'All seven sub-scores + percentile context',
      'AI-generated prioritized upgrade roadmap',
      'Printable PDF export',
      'Delivered instantly',
    ],
    highlighted: false,
    perSeat: false,
    purchasable: true,
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    priceUsdCents: 1200,
    currency: 'usd',
    fulfillment: 'human_reviewed',
    blurb:
      'AI report verified and signed off by a real coach. Our most popular.',
    features: [
      'Everything in Basic',
      'Human coach verification + written diagnosis',
      'Confidence-checked recommendations',
      'PDF + shareable result card',
    ],
    highlighted: true,
    perSeat: false,
    purchasable: true,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceUsdCents: 2900,
    currency: 'usd',
    fulfillment: 'senior_coach',
    blurb: 'Reviewed by a named senior coach, with an equipment deep-dive.',
    features: [
      'Everything in Standard',
      'Named senior coach review',
      'Hero equipment deep-dive (TH16+)',
      'Follow-up question window',
    ],
    highlighted: false,
    perSeat: false,
    purchasable: true,
  },
  account_rescue: {
    id: 'account_rescue',
    name: 'AccountRescue',
    priceUsdCents: 1900,
    currency: 'usd',
    fulfillment: 'human_reviewed',
    blurb:
      'For returning/rushed accounts: a de-rush plan and catch-up roadmap.',
    features: [
      'Everything in Standard',
      'Targeted de-rush plan',
      '"What changed" meta primer',
      '30-day catch-up roadmap',
    ],
    highlighted: false,
    perSeat: false,
    purchasable: true,
  },
  clan: {
    id: 'clan',
    name: 'Clan / Bulk',
    priceUsdCents: 800,
    currency: 'usd',
    fulfillment: 'human_reviewed',
    blurb: 'Per-seat pricing for whole rosters, with a leader dashboard.',
    features: [
      'Standard report per roster member',
      'Leader dashboard',
      'Volume per-seat pricing (10+ seats)',
    ],
    highlighted: false,
    perSeat: true,
    minSeats: 10,
    purchasable: true,
  },
};

export const PRICING_LIST: readonly PricingTier[] = SKU_IDS.map(
  (id) => PRICING_CATALOG[id],
);

/**
 * Conversion-focused grouping (Phase F — simplify pricing, reduce cognitive
 * load). The page leads with three PRIMARY tiers — Free (funnel top), Standard
 * (the $12 "volume workhorse" per MONETIZATION_ANALYSIS.md), and Pro (the $29
 * anchor that makes Standard feel sensible) — and tucks the situational tiers
 * (Basic, AccountRescue, Clan/Bulk) into a secondary section so the core
 * decision is a clean three-way choice. Prices are unchanged: the doc sets them
 * deliberately below the in-game impulse threshold, so the conversion lever is
 * clarity, not discounting.
 */
export const PRIMARY_SKU_IDS: readonly SkuId[] = ['free', 'standard', 'pro'];

export const PRIMARY_PRICING: readonly PricingTier[] = PRIMARY_SKU_IDS.map(
  (id) => PRICING_CATALOG[id],
);

export const SITUATIONAL_PRICING: readonly PricingTier[] = PRICING_LIST.filter(
  (t) => !PRIMARY_SKU_IDS.includes(t.id),
);

export function getTier(id: SkuId): PricingTier {
  return PRICING_CATALOG[id];
}

export function isPurchasable(id: SkuId): boolean {
  return PRICING_CATALOG[id].purchasable;
}

/** Total charge in cents for a tier and quantity (per-seat tiers multiply). */
export function priceForQuantity(tier: PricingTier, quantity = 1): number {
  const qty = tier.perSeat ? Math.max(tier.minSeats ?? 1, quantity) : 1;
  return tier.priceUsdCents * qty;
}

/** Human-readable price label, e.g. "Free", "$12", "$8 / seat". */
export function formatPrice(tier: PricingTier): string {
  if (tier.priceUsdCents === 0) return 'Free';
  const dollars = (tier.priceUsdCents / 100).toString();
  return tier.perSeat ? `$${dollars} / seat` : `$${dollars}`;
}
