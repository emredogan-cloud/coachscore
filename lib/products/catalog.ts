/**
 * Product SKU catalog (Phase 6). Prices from the multi-SKU monetization model
 * (ReplayDoctor is the high-frequency repeat-purchase engine; BaseDoctor and
 * WarPlan are per-event). Integer USD cents.
 */

import { PRODUCT_SKUS, type ProductSku } from './types';

export interface ProductTier {
  readonly sku: ProductSku;
  readonly name: string;
  readonly priceUsdCents: number;
  readonly fulfillment: 'instant_ai' | 'human_reviewed';
  readonly blurb: string;
  /** Repeat-purchase SKU (ReplayDoctor) vs. per-event. */
  readonly repeatable: boolean;
  readonly features: readonly string[];
}

export const PRODUCT_CATALOG: Readonly<Record<ProductSku, ProductTier>> = {
  replay_doctor: {
    sku: 'replay_doctor',
    name: 'ReplayDoctor',
    priceUsdCents: 900,
    fulfillment: 'human_reviewed',
    blurb: 'Attack-replay review: mistakes, timing, and exactly what to fix.',
    repeatable: true,
    features: [
      'Per-attack mistake analysis',
      'Timing + funnel breakdown',
      'Attack diagnosis + score',
      'Coach-verified recommendations',
    ],
  },
  base_doctor: {
    sku: 'base_doctor',
    name: 'BaseDoctor',
    priceUsdCents: 900,
    fulfillment: 'human_reviewed',
    blurb: 'Base audit: weaknesses, trap placement, anti-meta, and a roadmap.',
    repeatable: false,
    features: [
      'Weakness analysis',
      'Trap recommendations',
      'Anti-meta suggestions',
      'Defense readiness score',
    ],
  },
  war_plan: {
    sku: 'war_plan',
    name: 'WarPlan',
    priceUsdCents: 700,
    fulfillment: 'human_reviewed',
    blurb: 'Pre-war attack plan: army, spell + hero timing, and contingencies.',
    repeatable: false,
    features: [
      'Step-by-step attack plan',
      'Recommended army',
      'Spell + hero timing',
      'Contingency plans',
    ],
  },
};

export const PRODUCT_LIST: readonly ProductTier[] = PRODUCT_SKUS.map(
  (sku) => PRODUCT_CATALOG[sku],
);

export function getProduct(sku: ProductSku): ProductTier {
  return PRODUCT_CATALOG[sku];
}

export function formatProductPrice(tier: ProductTier): string {
  return `$${(tier.priceUsdCents / 100).toString()}`;
}
