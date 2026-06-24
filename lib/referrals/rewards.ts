/**
 * Referral reward policy (Phase 7). Integer-cent math. The reward amount is an
 * A/B variable in the roadmap (experiment `referral_incentive`), so the policy
 * is a parameter — a credit for the referrer + a flat discount for the referee,
 * capped so virality never cannibalizes margin.
 */

export interface RewardPolicy {
  /** Fraction of the qualifying order credited to the referrer. */
  readonly referrerPct: number;
  /** Hard cap on the referrer credit. */
  readonly referrerMaxCents: number;
  /** Flat discount granted to the referee. */
  readonly refereeFlatCents: number;
}

export const DEFAULT_REWARD_POLICY: RewardPolicy = {
  referrerPct: 0.2,
  referrerMaxCents: 500,
  refereeFlatCents: 200,
};

export interface ReferralReward {
  readonly referrerCents: number;
  readonly refereeCents: number;
}

export function computeReward(
  orderAmountCents: number,
  policy: RewardPolicy = DEFAULT_REWARD_POLICY,
): ReferralReward {
  const gross = Math.max(0, Math.round(orderAmountCents));
  const referrerCents = Math.min(
    policy.referrerMaxCents,
    Math.round(gross * policy.referrerPct),
  );
  return { referrerCents, refereeCents: policy.refereeFlatCents };
}
