import { describe, expect, it } from 'vitest';
import { createInMemoryRepositories } from '@/lib/db';
import type { RepoDeps } from '@/lib/db';

function deps(): RepoDeps {
  let n = 0;
  return {
    idGen: () => `id-${++n}`,
    now: () => new Date('2026-06-24T00:00:00.000Z'),
  };
}

describe('coaches repository', () => {
  it('create defaults, find by id/user, list by status/active, update', async () => {
    const { coaches } = createInMemoryRepositories(deps());
    const c = await coaches.create({
      userId: 'u1',
      displayName: 'C',
      bio: 'bio',
      specialties: ['war'],
    });
    expect(c.status).toBe('applied');
    expect(c.reputationScore).toBe(0);
    expect(await coaches.findByUserId('u1')).not.toBeNull();
    expect(await coaches.findByUserId('nope')).toBeNull();
    expect(await coaches.listByStatus('applied')).toHaveLength(1);
    await coaches.update(c.id, { status: 'active' });
    expect(await coaches.listActive()).toHaveLength(1);
    expect(await coaches.update('nope', { status: 'active' })).toBeNull();
  });
});

describe('coach applications + ratings repositories', () => {
  it('applications: status filter + update', async () => {
    const { coachApplications } = createInMemoryRepositories(deps());
    await coachApplications.create({
      userId: 'u1',
      displayName: 'C',
      bio: 'b',
      specialties: ['war'],
      motivation: 'm',
      experience: 'e',
    });
    expect(await coachApplications.listByStatus('pending')).toHaveLength(1);
    expect(
      await coachApplications.update('nope', { status: 'approved' }),
    ).toBeNull();
  });

  it('ratings: list by coach + update moderation', async () => {
    const { coachRatings } = createInMemoryRepositories(deps());
    const r = await coachRatings.create({ coachId: 'c1', stars: 5 });
    expect(r.moderation).toBe('visible');
    expect(await coachRatings.listByCoach('c1')).toHaveLength(1);
    expect(
      (await coachRatings.update(r.id, { moderation: 'hidden' }))?.moderation,
    ).toBe('hidden');
    expect(
      await coachRatings.update('nope', { moderation: 'hidden' }),
    ).toBeNull();
  });
});

describe('review assignments + moderations repositories', () => {
  it('assignments: list by status/coach + update', async () => {
    const { reviewAssignments } = createInMemoryRepositories(deps());
    const ra = await reviewAssignments.create({
      reportId: 'rep-1',
      coachId: 'c1',
    });
    expect(ra.status).toBe('unassigned');
    expect(await reviewAssignments.listByStatus('unassigned')).toHaveLength(1);
    expect(await reviewAssignments.listByCoach('c1')).toHaveLength(1);
    expect(
      await reviewAssignments.update('nope', { status: 'claimed' }),
    ).toBeNull();
  });

  it('moderations: find by assignment + update', async () => {
    const { moderations } = createInMemoryRepositories(deps());
    const m = await moderations.create({ reviewAssignmentId: 'ra-1' });
    expect(await moderations.findByAssignment('ra-1')).not.toBeNull();
    expect(await moderations.findByAssignment('nope')).toBeNull();
    expect(await moderations.findById(m.id)).not.toBeNull();
    expect(await moderations.update('nope', { status: 'approved' })).toBeNull();
  });
});

describe('payout accounts + payouts + disputes + notifications', () => {
  it('payout accounts: find by coach + update', async () => {
    const { payoutAccounts } = createInMemoryRepositories(deps());
    const a = await payoutAccounts.create({ coachId: 'c1' });
    expect(a.provider).toBe('stripe_connect');
    expect(a.status).toBe('pending');
    expect(await payoutAccounts.findByCoach('c1')).not.toBeNull();
    expect(await payoutAccounts.findByCoach('nope')).toBeNull();
    expect(
      (await payoutAccounts.update(a.id, { status: 'active' }))?.status,
    ).toBe('active');
    expect(
      await payoutAccounts.update('nope', { status: 'active' }),
    ).toBeNull();
  });

  it('payouts: list by coach + update', async () => {
    const { payouts } = createInMemoryRepositories(deps());
    const p = await payouts.create({ coachId: 'c1', amountCents: 720 });
    expect(p.status).toBe('pending');
    expect(await payouts.listByCoach('c1')).toHaveLength(1);
    expect((await payouts.update(p.id, { status: 'paid' }))?.status).toBe(
      'paid',
    );
    expect(await payouts.update('nope', { status: 'paid' })).toBeNull();
  });

  it('disputes: list by status + update', async () => {
    const { disputes } = createInMemoryRepositories(deps());
    const d = await disputes.create({ reason: 'something went wrong here' });
    expect(d.status).toBe('open');
    expect(await disputes.findById(d.id)).not.toBeNull();
    expect(await disputes.listByStatus('open')).toHaveLength(1);
    expect(await disputes.update('nope', { status: 'resolved' })).toBeNull();
  });

  it('notifications: list by user + update (mark read)', async () => {
    const { notifications } = createInMemoryRepositories(deps());
    const n = await notifications.create({
      userId: 'u1',
      kind: 'assignment',
      title: 't',
      body: 'b',
    });
    expect(n.status).toBe('queued');
    expect(await notifications.listByUser('u1')).toHaveLength(1);
    expect((await notifications.update(n.id, { status: 'read' }))?.status).toBe(
      'read',
    );
    expect(await notifications.update('nope', { status: 'read' })).toBeNull();
  });
});
