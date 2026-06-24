/**
 * Referral attribution (Phase 7). Extracts a referral code from an inbound URL
 * or `?ref=` param (the share-link entry point) and summarizes a referrer's
 * referrals into stats (the K-factor inputs). Pure.
 */

import type { ReferralRow } from '@/lib/db';
import { isValidReferralCode, normalizeReferralCode } from './code';

/** Pull a valid referral code from a bare code, a `?ref=CODE`, or an `/r/CODE`. */
export function parseReferralParam(
  input: string | null | undefined,
): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (isValidReferralCode(raw)) return normalizeReferralCode(raw);
  try {
    const url = new URL(raw, 'https://coachscore.app');
    const q = url.searchParams.get('ref');
    if (q && isValidReferralCode(q)) return normalizeReferralCode(q);
    const m = /\/r\/([^/?#]+)/.exec(url.pathname);
    if (m && isValidReferralCode(m[1]!)) return normalizeReferralCode(m[1]!);
  } catch {
    // not a URL — already handled the bare-code case above.
  }
  return null;
}

export interface ReferralStats {
  readonly total: number;
  readonly pending: number;
  readonly qualified: number;
  readonly rewardCents: number;
  /** Qualified / total — a per-referrer conversion proxy for K-factor. */
  readonly conversionRate: number;
}

export function referralStats(
  referrals: readonly ReferralRow[],
): ReferralStats {
  const total = referrals.length;
  const qualified = referrals.filter(
    (r) => r.status === 'qualified' || r.status === 'rewarded',
  ).length;
  const pending = referrals.filter((r) => r.status === 'pending').length;
  const rewardCents = referrals.reduce(
    (sum, r) => sum + (r.rewardCents ?? 0),
    0,
  );
  return {
    total,
    pending,
    qualified,
    rewardCents,
    conversionRate: total === 0 ? 0 : qualified / total,
  };
}
