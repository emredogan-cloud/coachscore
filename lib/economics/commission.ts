/**
 * Marketplace economics (Phase 5). The coach keeps 60% of a human-reviewed
 * report's price; the platform keeps 40% (reports/MONETIZATION_ANALYSIS.md:
 * coach payout ≈ 60% of price). Pure integer-cent math; the platform absorbs
 * any rounding remainder.
 */

export const COACH_SHARE_BPS = 6000; // 60% in basis points
export const PLATFORM_FEE_BPS = 10_000 - COACH_SHARE_BPS; // 40%

export interface RevenueSplit {
  readonly grossCents: number;
  readonly coachCents: number;
  readonly platformCents: number;
}

/** Split one gross amount into coach + platform (platform absorbs rounding). */
export function computeSplit(
  grossCents: number,
  coachShareBps: number = COACH_SHARE_BPS,
): RevenueSplit {
  const gross = Math.max(0, Math.round(grossCents));
  const bps = Math.min(10_000, Math.max(0, Math.round(coachShareBps)));
  const coachCents = Math.floor((gross * bps) / 10_000);
  return { grossCents: gross, coachCents, platformCents: gross - coachCents };
}

/** Aggregate a coach's earnings across multiple gross amounts. */
export function computeEarnings(
  grossCentsList: readonly number[],
  coachShareBps: number = COACH_SHARE_BPS,
): RevenueSplit {
  return grossCentsList.reduce<RevenueSplit>(
    (acc, gross) => {
      const split = computeSplit(gross, coachShareBps);
      return {
        grossCents: acc.grossCents + split.grossCents,
        coachCents: acc.coachCents + split.coachCents,
        platformCents: acc.platformCents + split.platformCents,
      };
    },
    { grossCents: 0, coachCents: 0, platformCents: 0 },
  );
}
