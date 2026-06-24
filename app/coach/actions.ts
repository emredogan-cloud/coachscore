'use server';

import { isDatabaseConfigured } from '@/lib/activation';
import type { Identity } from '@/lib/auth';
import {
  handleCoachApply,
  handleRateCoach,
  handleRaiseDispute,
  type HandlerResult,
} from '@/lib/api';
import {
  resolveIdentity,
  resolveMarketplaceService,
  resolvePayoutService,
} from '@/lib/api/marketplace-wire';
import type { MarketplaceService } from '@/lib/marketplace';

/**
 * Coach-facing server actions (Phase 5). The application/rating/dispute entry
 * points reuse the API handlers; the dashboard operations call the
 * MarketplaceService, gated on database activation.
 */

export interface ActionResult {
  readonly ok: boolean;
  readonly error?: string;
  readonly url?: string;
}

async function run(
  fn: (service: MarketplaceService, identity: Identity) => Promise<unknown>,
): Promise<ActionResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: 'not_activated' };
  try {
    await fn(resolveMarketplaceService(), resolveIdentity());
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'failed' };
  }
}

export async function submitCoachApplication(
  body: unknown,
): Promise<HandlerResult> {
  return handleCoachApply(body);
}
export async function submitCoachRating(body: unknown): Promise<HandlerResult> {
  return handleRateCoach(body);
}
export async function submitDispute(body: unknown): Promise<HandlerResult> {
  return handleRaiseDispute(body);
}

export async function claimReview(assignmentId: string): Promise<ActionResult> {
  return run((s, i) => s.claimReview(i, assignmentId));
}
export async function startReview(assignmentId: string): Promise<ActionResult> {
  return run((s, i) => s.startReview(i, assignmentId));
}
export async function submitReview(
  assignmentId: string,
  notes?: string,
): Promise<ActionResult> {
  return run((s, i) => s.submitReview(i, assignmentId, { notes }));
}
export async function releaseReview(
  assignmentId: string,
): Promise<ActionResult> {
  return run((s, i) => s.releaseReview(i, assignmentId));
}
export async function activateCoachProfile(
  coachId: string,
): Promise<ActionResult> {
  return run((s, i) => s.activateCoach(i, coachId));
}

export async function startPayoutOnboarding(
  coachId: string,
  refreshUrl: string,
  returnUrl: string,
): Promise<ActionResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: 'not_activated' };
  try {
    const result = await resolvePayoutService().startOnboarding(coachId, {
      refreshUrl,
      returnUrl,
    });
    return { ok: true, url: result.url };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'failed' };
  }
}
