import { describe, expect, it } from 'vitest';
import {
  handleCoachApply,
  handleRateCoach,
  handleRaiseDispute,
} from '@/lib/api';
import { createInMemoryRepositories } from '@/lib/db';
import type { RepoDeps } from '@/lib/db';
import type { Identity } from '@/lib/auth';
import { MarketplaceService } from '@/lib/marketplace';

function deps(): RepoDeps {
  let n = 0;
  return {
    idGen: () => `id-${++n}`,
    now: () => new Date('2026-06-24T00:00:00.000Z'),
  };
}
const user: Identity = { userId: 'u1', role: 'user' };

const application = {
  displayName: 'WarCoach',
  bio: 'I have coached competitive war clans for five years running.',
  specialties: ['war'],
  motivation: 'I want to help players climb the war ladder efficiently.',
  experience: 'Led three clans to Champion League over multiple seasons.',
};

describe('handleCoachApply', () => {
  it('rejects an invalid body (422)', async () => {
    expect((await handleCoachApply({ displayName: '' })).status).toBe(422);
  });

  it('returns 503 when the marketplace is not activated', async () => {
    expect(
      (await handleCoachApply(application, { isActivated: () => false }))
        .status,
    ).toBe(503);
  });

  it('creates an application when activated', async () => {
    const service = new MarketplaceService(createInMemoryRepositories(deps()));
    const res = await handleCoachApply(application, {
      isActivated: () => true,
      service,
      identity: user,
    });
    expect(res.status).toBe(200);
    expect((res.body as { status: string }).status).toBe('pending');
  });

  it('maps a domain error to 422 (passes zod but fails profile validation)', async () => {
    const service = new MarketplaceService(createInMemoryRepositories(deps()));
    const res = await handleCoachApply(
      { ...application, bio: 'short' },
      { isActivated: () => true, service, identity: user },
    );
    expect(res.status).toBe(422);
  });
});

describe('handleRateCoach', () => {
  it('rates an existing coach when activated', async () => {
    const repos = createInMemoryRepositories(deps());
    const service = new MarketplaceService(repos);
    const coach = await repos.coaches.create({
      userId: 'cU',
      displayName: 'C',
      bio: 'b',
      specialties: ['war'],
    });
    const res = await handleRateCoach(
      { coachId: coach.id, stars: 5 },
      { isActivated: () => true, service, identity: user },
    );
    expect(res.status).toBe(200);
  });

  it('returns 503 when not activated and 422 for a bad rating', async () => {
    expect(
      (
        await handleRateCoach(
          { coachId: 'c', stars: 5 },
          { isActivated: () => false },
        )
      ).status,
    ).toBe(503);
    expect((await handleRateCoach({ coachId: 'c', stars: 9 })).status).toBe(
      422,
    );
  });
});

describe('handleRaiseDispute', () => {
  it('raises a dispute when activated', async () => {
    const service = new MarketplaceService(createInMemoryRepositories(deps()));
    const res = await handleRaiseDispute(
      { reportId: 'rep-1', reason: 'The report missed my equipment levels.' },
      { isActivated: () => true, service, identity: user },
    );
    expect(res.status).toBe(200);
    expect((res.body as { status: string }).status).toBe('open');
  });

  it('rejects a short reason (422) and reports not_activated (503)', async () => {
    expect((await handleRaiseDispute({ reason: 'short' })).status).toBe(422);
    expect(
      (
        await handleRaiseDispute(
          { reason: 'a sufficiently long reason here' },
          { isActivated: () => false },
        )
      ).status,
    ).toBe(503);
  });
});
