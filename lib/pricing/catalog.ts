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
    name: 'Premium Report',
    priceUsdCents: 700,
    currency: 'usd',
    fulfillment: 'instant_ai',
    blurb: 'Your full report, generated instantly from your account data.',
    features: [
      'Every sub-score we can read, with your weak spots',
      'Prioritized, goal-aware upgrade roadmap',
      'Printable PDF export',
      'Delivered instantly',
    ],
    highlighted: true,
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
    name: 'Account Rescue',
    priceUsdCents: 1900,
    currency: 'usd',
    fulfillment: 'instant_ai',
    blurb:
      'For returning or rushed accounts: an instant de-rush and catch-up roadmap.',
    features: [
      'Everything in the Premium Report',
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
 * Public product surface (PMF-correction sprint). The simplified, honest public
 * product is a clean three: Free (funnel top) → Premium Report ($7, instant AI)
 * → Account Rescue ($19, instant AI de-rush). These are the only tiers we can
 * fulfill today without staffed human coaches.
 *
 * The human-reviewed tiers (Standard, Pro) and the per-seat Clan/Bulk plan are
 * preserved in `PRICING_CATALOG` but live behind feature flags (`human_review_
 * enabled`, `clan_plans_enabled`, default OFF — see lib/experiments) and surface
 * via `gatedPricing(...)`. Prices are unchanged (set below the in-game impulse
 * threshold); the conversion lever is clarity, not discounting.
 */
export const PRIMARY_SKU_IDS: readonly SkuId[] = [
  'free',
  'basic',
  'account_rescue',
];

export const PRIMARY_PRICING: readonly PricingTier[] = PRIMARY_SKU_IDS.map(
  (id) => PRICING_CATALOG[id],
);

/** Tiers preserved in code but gated behind feature flags (default hidden). */
export const GATED_SKU_IDS: readonly SkuId[] = ['standard', 'pro', 'clan'];

export const SITUATIONAL_PRICING: readonly PricingTier[] = GATED_SKU_IDS.map(
  (id) => PRICING_CATALOG[id],
);

/**
 * Which gated tiers are currently visible, given flag state. Pure: caller passes
 * the resolved flags so this module stays free of an experiments import.
 * Standard/Pro need human review staffed; Clan needs the B2B plan switched on.
 */
export function gatedPricing(flags: {
  humanReview: boolean;
  clanPlans: boolean;
}): readonly PricingTier[] {
  return SITUATIONAL_PRICING.filter((t) =>
    t.id === 'clan' ? flags.clanPlans : flags.humanReview,
  );
}

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
