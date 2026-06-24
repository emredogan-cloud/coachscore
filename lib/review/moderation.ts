/**
 * Report moderation (Phase 5) — quality review of a coach-submitted review.
 * pending → approved | revision_requested | rejected; revision_requested →
 * pending (after the coach resubmits). Terminal: approved, rejected.
 */

import { createStateMachine } from '@/lib/fsm';

export const MODERATION_STATUSES = [
  'pending',
  'approved',
  'revision_requested',
  'rejected',
] as const;

export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export const moderationMachine = createStateMachine<ModerationStatus>({
  pending: ['approved', 'revision_requested', 'rejected'],
  revision_requested: ['pending'],
  approved: [],
  rejected: [],
});
