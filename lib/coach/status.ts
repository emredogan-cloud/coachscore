/**
 * Coach status lifecycle (Phase 5). applied → under_review → approved → active,
 * with suspend/deactivate/reject branches. Terminal: deactivated, rejected.
 */

import { createStateMachine } from '@/lib/fsm';

export const COACH_STATUSES = [
  'applied',
  'under_review',
  'approved',
  'active',
  'suspended',
  'deactivated',
  'rejected',
] as const;

export type CoachStatus = (typeof COACH_STATUSES)[number];

export const coachStatusMachine = createStateMachine<CoachStatus>({
  applied: ['under_review', 'rejected'],
  under_review: ['approved', 'rejected'],
  approved: ['active', 'deactivated'],
  active: ['suspended', 'deactivated'],
  suspended: ['active', 'deactivated'],
  deactivated: [],
  rejected: [],
});
