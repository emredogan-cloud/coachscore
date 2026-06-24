import { describe, expect, it } from 'vitest';
import { moderationMachine, reviewMachine } from '@/lib/review';
import { disputeMachine } from '@/lib/disputes';

describe('review workflow machine', () => {
  it('covers claim → review → submit → decision', () => {
    expect(reviewMachine.can('unassigned', 'claimed')).toBe(true);
    expect(reviewMachine.can('unassigned', 'assigned')).toBe(true);
    expect(reviewMachine.can('claimed', 'in_review')).toBe(true);
    expect(reviewMachine.can('in_review', 'submitted')).toBe(true);
    expect(reviewMachine.can('submitted', 'approved')).toBe(true);
    expect(reviewMachine.can('submitted', 'in_review')).toBe(true); // revision
    expect(reviewMachine.can('in_review', 'escalated')).toBe(true);
    expect(reviewMachine.can('approved', 'rejected')).toBe(false);
    expect(reviewMachine.isTerminal('approved')).toBe(true);
  });

  it('allows release back to unassigned', () => {
    expect(reviewMachine.can('claimed', 'unassigned')).toBe(true);
    expect(reviewMachine.can('in_review', 'unassigned')).toBe(true);
  });
});

describe('moderation machine', () => {
  it('pending → approve / request-revision / reject; revision loops back', () => {
    expect(moderationMachine.can('pending', 'approved')).toBe(true);
    expect(moderationMachine.can('pending', 'revision_requested')).toBe(true);
    expect(moderationMachine.can('revision_requested', 'pending')).toBe(true);
    expect(moderationMachine.isTerminal('approved')).toBe(true);
    expect(moderationMachine.isTerminal('rejected')).toBe(true);
  });
});

describe('dispute machine', () => {
  it('open → under_review → resolved/refunded/rejected', () => {
    expect(disputeMachine.can('open', 'under_review')).toBe(true);
    expect(disputeMachine.can('open', 'refunded')).toBe(true);
    expect(disputeMachine.can('under_review', 'resolved')).toBe(true);
    expect(disputeMachine.isTerminal('refunded')).toBe(true);
    expect(disputeMachine.can('resolved', 'open')).toBe(false);
  });
});
