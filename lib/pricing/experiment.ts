/**
 * Premium Report price-point experiment (Phase 7).
 *
 * Tests cheaper, impulse-range price points for the Premium Report against the
 * current $7 control:
 *   control → $7 (catalog)   ·   p2 → $2   ·   p4 → $4
 *
 * The hypothesis (rationale in FINAL_PREMIUM_VISUAL_REPORT.md) is that a price
 * under the ~$5 in-game impulse threshold lifts conversion enough to beat $7 on
 * revenue-per-visitor. Assignment is the existing deterministic, sticky bucketer
 * keyed by subjectId, so a visitor always sees one price.
 *
 * INTEGRITY: the display and the checkout charge MUST both call
 * `resolveReportPriceCents(subjectId)` so a buyer is charged exactly the price
 * they saw. Going live also needs a payment-provider variant per price point;
 * until then the experiment stays `draft` and the catalog $7 is what ships.
 *
 * Pure + unit-tested.
 */

import { assignVariant, getExperiment } from '@/lib/experiments';
import { getTier } from './catalog';

export const REPORT_PRICE_EXPERIMENT = 'report_price_point';

/** Variant key → Premium Report price in USD cents. */
export const PRICE_POINT_CENTS: Readonly<Record<string, number>> = {
  control: 700,
  p2: 200,
  p4: 400,
};

/** The catalog control price ($7) — the fallback for any unknown variant. */
export function controlPriceCents(): number {
  return getTier('basic').priceUsdCents;
}

/** Price (USD cents) for a variant key; unknown variants fall back to control. */
export function reportPriceCentsFor(variant: string): number {
  return PRICE_POINT_CENTS[variant] ?? controlPriceCents();
}

export interface ResolvedReportPrice {
  readonly variant: string;
  readonly cents: number;
}

/**
 * A subject's sticky price assignment. Call this from BOTH the price display and
 * the checkout handler so they never disagree. If the experiment isn't
 * registered, everyone gets the control price.
 */
export function resolveReportPriceCents(
  subjectId: string,
): ResolvedReportPrice {
  const experiment = getExperiment(REPORT_PRICE_EXPERIMENT);
  if (experiment === null) {
    return { variant: 'control', cents: controlPriceCents() };
  }
  const variant = assignVariant(experiment, subjectId);
  return { variant, cents: reportPriceCentsFor(variant) };
}
