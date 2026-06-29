import { describe, expect, it } from 'vitest';
import {
  COMPARISON,
  formatPrice,
  getTier,
  isPurchasable,
  PRICING_CATALOG,
  PRICING_LIST,
  priceForQuantity,
  SKU_IDS,
} from '@/lib/pricing';

describe('pricing catalog', () => {
  it('covers every SKU id', () => {
    expect(PRICING_LIST).toHaveLength(SKU_IDS.length);
    for (const id of SKU_IDS) expect(PRICING_CATALOG[id].id).toBe(id);
  });

  it('Standard is the highlighted, human-reviewed $12 workhorse', () => {
    const standard = getTier('standard');
    expect(standard.priceUsdCents).toBe(1200);
    expect(standard.highlighted).toBe(true);
    expect(standard.fulfillment).toBe('human_reviewed');
  });

  it('Free is not purchasable; paid tiers are', () => {
    expect(isPurchasable('free')).toBe(false);
    expect(isPurchasable('standard')).toBe(true);
    expect(isPurchasable('basic')).toBe(true);
  });

  it('formats prices for free, flat, and per-seat tiers', () => {
    expect(formatPrice(getTier('free'))).toBe('Free');
    expect(formatPrice(getTier('standard'))).toBe('$12');
    expect(formatPrice(getTier('clan'))).toBe('$8 / seat');
  });

  it('per-seat pricing multiplies and enforces the seat minimum', () => {
    const clan = getTier('clan');
    expect(priceForQuantity(clan, 15)).toBe(800 * 15);
    expect(priceForQuantity(clan, 3)).toBe(800 * 10); // min 10 seats
    expect(priceForQuantity(getTier('standard'), 5)).toBe(1200); // flat
  });
});

describe('comparison matrix', () => {
  it('every row has a cell for every SKU', () => {
    for (const row of COMPARISON) {
      for (const id of SKU_IDS) {
        expect(row.cells).toHaveProperty(id);
      }
    }
  });

  it('does not advertise human review in the public comparison', () => {
    // PMF-correction sprint: the "Human coach review" row was removed — we don't
    // sell human review we can't staff.
    expect(
      COMPARISON.find((r) => r.feature === 'Human coach review'),
    ).toBeUndefined();
  });

  it('encodes the de-rush plan as the Account Rescue differentiator', () => {
    const deRush = COMPARISON.find((r) => r.feature === 'De-rush plan');
    expect(deRush?.cells.account_rescue).toBe(true);
    expect(deRush?.cells.basic).toBe(false);
    expect(deRush?.cells.free).toBe(false);
  });
});
