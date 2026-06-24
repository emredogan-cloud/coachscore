/**
 * Human review workflow (Phase 5) — a coach taking an AI-drafted report from the
 * queue through to a decision.
 *
 * unassigned → (assigned by admin | claimed by coach) → claimed → in_review →
 * submitted → approved | rejected; with release-back-to-unassigned, escalation,
 * and revision (submitted → in_review) branches. Terminal: approved, rejected.
 */

import { createStateMachine } from '@/lib/fsm';

export const REVIEW_STATUSES = [
  'unassigned',
  'assigned',
  'claimed',
  'in_review',
  'submitted',
  'approved',
  'rejected',
  'escalated',
] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const reviewMachine = createStateMachine<ReviewStatus>({
  unassigned: ['assigned', 'claimed'],
  assigned: ['claimed', 'unassigned', 'escalated'],
  claimed: ['in_review', 'unassigned'],
  in_review: ['submitted', 'unassigned', 'escalated'],
  submitted: ['approved', 'rejected', 'in_review', 'escalated'],
  escalated: ['assigned', 'approved', 'rejected'],
  approved: [],
  rejected: [],
});
