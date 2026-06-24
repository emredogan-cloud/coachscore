'use server';

import { isDatabaseConfigured } from '@/lib/activation';
import type { Identity } from '@/lib/auth';
import type { CoachStatus } from '@/lib/coach';
import type { DisputeStatus } from '@/lib/disputes';
import {
  resolveIdentity,
  resolveMarketplaceService,
  resolvePayoutService,
} from '@/lib/api/marketplace-wire';
import type { MarketplaceService } from '@/lib/marketplace';

/**
 * Admin server actions (Phase 5) — coach approval, review assignment,
 * moderation, coach status, dispute resolution, and payout execution. All gated
 * on database activation; identity is resolved server-side (admin at activation).
 */

export interface ActionResult {
  readonly ok: boolean;
  readonly error?: string;
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

export async function approveApplication(
  applicationId: string,
): Promise<ActionResult> {
  return run((s, i) => s.approveApplication(i, applicationId));
}
export async function rejectApplication(
  applicationId: string,
  notes?: string,
): Promise<ActionResult> {
  return run((s, i) => s.rejectApplication(i, applicationId, notes));
}
export async function assignReview(
  assignmentId: string,
  coachId: string,
): Promise<ActionResult> {
  return run((s, i) => s.assignReview(i, assignmentId, coachId));
}
export async function moderateApprove(
  moderationId: string,
  grossCents: number,
): Promise<ActionResult> {
  return run((s, i) => s.moderateApprove(i, moderationId, { grossCents }));
}
export async function moderateRequestRevision(
  moderationId: string,
  notes?: string,
): Promise<ActionResult> {
  return run((s, i) => s.moderateRequestRevision(i, moderationId, notes));
}
export async function moderateReject(
  moderationId: string,
  notes?: string,
): Promise<ActionResult> {
  return run((s, i) => s.moderateReject(i, moderationId, notes));
}
export async function setCoachStatus(
  coachId: string,
  status: CoachStatus,
): Promise<ActionResult> {
  return run((s, i) => s.setCoachStatus(i, coachId, status));
}
export async function resolveDispute(
  disputeId: string,
  status: DisputeStatus,
  notes?: string,
): Promise<ActionResult> {
  return run((s, i) => s.resolveDispute(i, disputeId, status, notes));
}

export async function executePayout(payoutId: string): Promise<ActionResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: 'not_activated' };
  try {
    await resolvePayoutService().executePayout(payoutId);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'failed' };
  }
}
