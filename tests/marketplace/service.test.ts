import { beforeEach, describe, expect, it } from 'vitest';
import { createInMemoryRepositories } from '@/lib/db';
import type { Repositories, RepoDeps } from '@/lib/db';
import { AuthorizationError } from '@/lib/auth';
import type { Identity } from '@/lib/auth';
import { InvalidTransitionError } from '@/lib/fsm';
import { MarketplaceError, MarketplaceService } from '@/lib/marketplace';

function deps(): RepoDeps {
  let n = 0;
  return {
    idGen: () => `id-${++n}`,
    now: () => new Date('2026-06-24T00:00:00.000Z'),
  };
}

const admin: Identity = { userId: 'admin', role: 'admin' };
const coachUser: Identity = { userId: 'coachU', role: 'coach' };
const user: Identity = { userId: 'u1', role: 'user' };
const anon: Identity = { userId: null, role: 'anon' };

const application = {
  displayName: 'WarCoach',
  bio: 'I have coached competitive war clans for five years running.',
  specialties: ['war', 'equipment'],
  motivation: 'I want to help players climb the war ladder efficiently.',
  experience: 'Led three clans to Champion League over multiple seasons.',
};

let repos: Repositories;
let svc: MarketplaceService;
beforeEach(() => {
  repos = createInMemoryRepositories(deps());
  svc = new MarketplaceService(
    repos,
    () => new Date('2026-06-24T12:00:00.000Z'),
  );
});

async function activeCoach() {
  const app = await svc.applyAsCoach(coachUser, application);
  const coach = await svc.approveApplication(admin, app.id);
  await svc.activateCoach(coachUser, coach.id);
  return coach;
}

describe('coach onboarding', () => {
  it('apply → approve → activate', async () => {
    const app = await svc.applyAsCoach(coachUser, application);
    expect(app.status).toBe('pending');
    const coach = await svc.approveApplication(admin, app.id);
    expect(coach.status).toBe('approved');
    expect(coach.userId).toBe('coachU');
    const active = await svc.activateCoach(coachUser, coach.id);
    expect(active.status).toBe('active');
  });

  it('rejects an invalid application and anonymous users', async () => {
    await expect(
      svc.applyAsCoach(coachUser, { ...application, bio: 'short' }),
    ).rejects.toThrow(MarketplaceError);
    await expect(svc.applyAsCoach(anon, application)).rejects.toThrow(
      MarketplaceError,
    );
  });

  it('only admins approve/reject', async () => {
    const app = await svc.applyAsCoach(coachUser, application);
    await expect(svc.approveApplication(user, app.id)).rejects.toThrow(
      AuthorizationError,
    );
    const rejected = await svc.rejectApplication(admin, app.id, 'not yet');
    expect(rejected.status).toBe('rejected');
  });
});

describe('review workflow + moderation + payout', () => {
  it('claim → review → submit → approve → payout (60%)', async () => {
    const coach = await activeCoach();
    const ra = await svc.createReviewAssignment(admin, { reportId: 'rep-1' });
    expect(ra.status).toBe('unassigned');

    const claimed = await svc.claimReview(coachUser, ra.id);
    expect(claimed.status).toBe('claimed');
    expect(claimed.coachId).toBe(coach.id);

    await svc.startReview(coachUser, ra.id);
    const { moderation } = await svc.submitReview(coachUser, ra.id, {
      notes: 'Looks good with minor tweaks.',
    });
    expect(moderation.status).toBe('pending');

    const result = await svc.moderateApprove(admin, moderation.id, {
      grossCents: 1200,
    });
    expect(result.moderation.status).toBe('approved');
    expect(result.payout?.amountCents).toBe(720); // 60% of 1200
    const finalRa = await repos.reviewAssignments.findById(ra.id);
    expect(finalRa?.status).toBe('approved');
    const notes = await repos.notifications.listByUser('coachU');
    expect(notes.some((n) => n.kind === 'payout')).toBe(true);
  });

  it('moderation can request a revision (review returns to in_review)', async () => {
    await activeCoach();
    const ra = await svc.createReviewAssignment(admin, { reportId: 'rep-2' });
    await svc.claimReview(coachUser, ra.id);
    await svc.startReview(coachUser, ra.id);
    const { moderation } = await svc.submitReview(coachUser, ra.id, {});
    await svc.moderateRequestRevision(admin, moderation.id, 'Add more detail.');
    expect((await repos.reviewAssignments.findById(ra.id))?.status).toBe(
      'in_review',
    );
  });

  it('non-coaches cannot claim; illegal transitions throw', async () => {
    const ra = await svc.createReviewAssignment(admin, { reportId: 'rep-3' });
    await expect(svc.claimReview(user, ra.id)).rejects.toThrow(
      AuthorizationError,
    );
    // approve straight from unassigned is illegal
    await activeCoach();
    await svc.claimReview(coachUser, ra.id);
    await expect(svc.submitReview(coachUser, ra.id, {})).rejects.toThrow(
      InvalidTransitionError,
    ); // must start review first
  });
});

describe('ratings + reputation', () => {
  it('rating updates the coach reputation score', async () => {
    const coach = await activeCoach();
    await svc.rateCoach(user, { coachId: coach.id, stars: 5 });
    const updated = await repos.coaches.findById(coach.id);
    expect(updated?.ratingCount).toBe(1);
    expect(updated?.reputationScore).toBe(83); // bayes (20+5)/6 = 4.167 → 83
    await expect(
      svc.rateCoach(user, { coachId: coach.id, stars: 9 }),
    ).rejects.toThrow(MarketplaceError);
  });
});

describe('disputes', () => {
  it('raise → resolve via the state machine', async () => {
    const dispute = await svc.raiseDispute(user, {
      reportId: 'rep-1',
      reason: 'The report missed my equipment levels.',
    });
    expect(dispute.status).toBe('open');
    const resolved = await svc.resolveDispute(
      admin,
      dispute.id,
      'refunded',
      'Refunded.',
    );
    expect(resolved.status).toBe('refunded');
    await expect(svc.resolveDispute(admin, dispute.id, 'open')).rejects.toThrow(
      InvalidTransitionError,
    );
  });
});
