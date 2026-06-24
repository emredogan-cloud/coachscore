/**
 * Coach reputation (Phase 5). A Bayesian-damped average of 1–5 star ratings, so
 * a coach with few ratings is pulled toward the prior mean rather than swinging
 * on a single review. Pure.
 */

import { clamp } from '@/lib/core';

const PRIOR_MEAN = 4.0;
const PRIOR_WEIGHT = 5;

export interface RatingSummary {
  readonly count: number;
  /** Raw arithmetic mean of stars (0 when no ratings). */
  readonly average: number;
  /** 0–100 reputation from the Bayesian-damped average. */
  readonly reputationScore: number;
}

export function summarizeRatings(stars: readonly number[]): RatingSummary {
  const valid = stars
    .filter((s) => Number.isFinite(s))
    .map((s) => clamp(s, 1, 5));
  const count = valid.length;
  const sum = valid.reduce((a, b) => a + b, 0);
  const average = count === 0 ? 0 : sum / count;
  const bayes = (PRIOR_MEAN * PRIOR_WEIGHT + sum) / (PRIOR_WEIGHT + count);
  return { count, average, reputationScore: Math.round((bayes / 5) * 100) };
}
