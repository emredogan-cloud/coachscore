import { describe, expect, it } from 'vitest';
import {
  COACH_SHARE_BPS,
  computeEarnings,
  computeSplit,
  PLATFORM_FEE_BPS,
} from '@/lib/economics';

describe('computeSplit', () => {
  it('splits 60/40 with the platform absorbing rounding', () => {
    expect(COACH_SHARE_BPS).toBe(6000);
    expect(PLATFORM_FEE_BPS).toBe(4000);
    expect(computeSplit(1200)).toEqual({
      grossCents: 1200,
      coachCents: 720,
      platformCents: 480,
    });
    // 1199 * 0.6 = 719.4 → coach floored to 719, platform keeps the remainder
    expect(computeSplit(1199)).toEqual({
      grossCents: 1199,
      coachCents: 719,
      platformCents: 480,
    });
  });

  it('guards negative / zero', () => {
    expect(computeSplit(0).coachCents).toBe(0);
    expect(computeSplit(-50).grossCents).toBe(0);
  });
});

describe('computeEarnings', () => {
  it('aggregates across reports', () => {
    expect(computeEarnings([1200, 700])).toEqual({
      grossCents: 1900,
      coachCents: 1140, // 720 + 420
      platformCents: 760, // 480 + 280
    });
    expect(computeEarnings([])).toEqual({
      grossCents: 0,
      coachCents: 0,
      platformCents: 0,
    });
  });
});
