import { describe, expect, it } from 'vitest';
import {
  controlPriceCents,
  PRICE_POINT_CENTS,
  reportPriceCentsFor,
  resolveReportPriceCents,
} from '@/lib/pricing/experiment';

describe('report price-point experiment', () => {
  it('maps variants to the documented price points', () => {
    expect(reportPriceCentsFor('control')).toBe(700);
    expect(reportPriceCentsFor('p2')).toBe(200);
    expect(reportPriceCentsFor('p4')).toBe(400);
    expect(PRICE_POINT_CENTS.control).toBe(700);
  });

  it('falls back to the control price for an unknown variant', () => {
    expect(reportPriceCentsFor('nonsense')).toBe(controlPriceCents());
    expect(controlPriceCents()).toBe(700);
  });

  it('assigns a sticky, valid price for a subject', () => {
    const a = resolveReportPriceCents('subject-abc');
    const again = resolveReportPriceCents('subject-abc');
    expect(again).toEqual(a); // deterministic / sticky
    expect(['control', 'p2', 'p4']).toContain(a.variant);
    expect([200, 400, 700]).toContain(a.cents);
    expect(a.cents).toBe(reportPriceCentsFor(a.variant)); // consistent pair
  });

  it('spreads subjects across more than one variant', () => {
    const variants = new Set(
      Array.from(
        { length: 200 },
        (_, i) => resolveReportPriceCents(`subject-${i}`).variant,
      ),
    );
    expect(variants.size).toBeGreaterThan(1);
  });
});
