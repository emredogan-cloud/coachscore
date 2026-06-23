/**
 * Pricing / SKU types (Phase 4). SKU ids mirror the `report_tier` Postgres enum
 * so a purchased tier maps directly to a report. Prices are integer USD cents.
 */

export const SKU_IDS = [
  'free',
  'basic',
  'standard',
  'pro',
  'account_rescue',
  'clan',
] as const;

export type SkuId = (typeof SKU_IDS)[number];

export type Fulfillment =
  | 'free'
  | 'instant_ai'
  | 'human_reviewed'
  | 'senior_coach';

export interface PricingTier {
  readonly id: SkuId;
  readonly name: string;
  readonly priceUsdCents: number;
  readonly currency: 'usd';
  readonly fulfillment: Fulfillment;
  readonly blurb: string;
  readonly features: readonly string[];
  readonly highlighted: boolean;
  /** Per-seat pricing (clan/bulk) charges price × quantity. */
  readonly perSeat: boolean;
  readonly minSeats?: number;
  /** Free teaser is not a checkout SKU. */
  readonly purchasable: boolean;
}
