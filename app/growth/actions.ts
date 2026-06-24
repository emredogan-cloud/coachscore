'use server';

import {
  handleClaimReferral,
  handleCreateReferralCode,
  handleMyReferrals,
  handleTrackEvent,
  type HandlerResult,
} from '@/lib/api';

/** Server actions for the growth/referral UI (Phase 7). Thin handler wrappers. */

export async function requestReferralCode(): Promise<HandlerResult> {
  return handleCreateReferralCode();
}

export async function requestClaimReferral(
  body: unknown,
): Promise<HandlerResult> {
  return handleClaimReferral(body);
}

export async function requestMyReferrals(): Promise<HandlerResult> {
  return handleMyReferrals();
}

export async function trackEvent(body: unknown): Promise<HandlerResult> {
  return handleTrackEvent(body);
}
