/**
 * Dispute resolution lifecycle (Phase 5). open → under_review → resolved |
 * refunded | rejected (and the terminal decisions are reachable directly from
 * open for fast paths). Terminal: resolved, refunded, rejected.
 */

import { createStateMachine } from '@/lib/fsm';

export const DISPUTE_STATUSES = [
  'open',
  'under_review',
  'resolved',
  'refunded',
  'rejected',
] as const;

export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];

export const disputeMachine = createStateMachine<DisputeStatus>({
  open: ['under_review', 'resolved', 'refunded', 'rejected'],
  under_review: ['resolved', 'refunded', 'rejected'],
  resolved: [],
  refunded: [],
  rejected: [],
});
