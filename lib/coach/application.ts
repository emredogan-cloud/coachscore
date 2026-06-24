/**
 * Coach application status (Phase 5). pending → approved | rejected.
 */

import { createStateMachine } from '@/lib/fsm';

export const APPLICATION_STATUSES = [
  'pending',
  'approved',
  'rejected',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const applicationMachine = createStateMachine<ApplicationStatus>({
  pending: ['approved', 'rejected'],
  approved: [],
  rejected: [],
});
