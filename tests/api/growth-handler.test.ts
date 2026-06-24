import { describe, expect, it } from 'vitest';
import {
  handleAssignExperiment,
  handleClaimReferral,
  handleCreateReferralCode,
  handleGetFlags,
  handleGrowthDashboard,
  handleMyReferrals,
  handleTrackEvent,
} from '@/lib/api';
import { createInMemoryRepositories } from '@/lib/db';
import type { Repositories, RepoDeps } from '@/lib/db';
import type { Identity } from '@/lib/auth';
import { MemoryAnalyticsProvider } from '@/lib/analytics';
import { GrowthService } from '@/lib/growth';
import { ReferralService } from '@/lib/referrals';

function repoDeps(): RepoDeps {
  let n = 0;
  return {
    idGen: () => `id-${++n}`,
    now: () => new Date('2026-06-24T00:00:00.000Z'),
  };
}
const user: Identity = { userId: 'u1', role: 'user' };
const other: Identity = { userId: 'u2', role: 'user' };
const admin: Identity = { userId: 'admin', role: 'admin' };

describe('handleTrackEvent', () => {
  it('captures a valid event (no persistence without a DB)', async () => {
    const res = await handleTrackEvent(
      { name: 'teaser_completed', context: { anonId: 'a1' } },
      { provider: new MemoryAnalyticsProvider(), isDbConfigured: () => false },
    );
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, persisted: false });
  });

  it('rejects an event outside the taxonomy with 422', async () => {
    const res = await handleTrackEvent(
      { name: 'not_a_real_event' },
      { provider: new MemoryAnalyticsProvider(), isDbConfigured: () => false },
    );
    expect(res.status).toBe(422);
  });

  it('persists when repos are provided', async () => {
    const repos = createInMemoryRepositories(repoDeps());
    const res = await handleTrackEvent(
      { name: 'landing_viewed' },
      { provider: new MemoryAnalyticsProvider(), repos },
    );
    expect(res.body).toMatchObject({ persisted: true });
    expect(await repos.analyticsEvents.list()).toHaveLength(1);
  });
});

describe('handleAssignExperiment + handleGetFlags', () => {
  it('assigns a variant deterministically', async () => {
    const res = await handleAssignExperiment(
      { subjectId: 'u1', experimentKey: 'teaser_reveal_depth' },
      { provider: new MemoryAnalyticsProvider(), isDbConfigured: () => false },
    );
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ experimentKey: 'teaser_reveal_depth' });
  });

  it('422s an unknown experiment', async () => {
    const res = await handleAssignExperiment(
      { subjectId: 'u1', experimentKey: 'nope' },
      { provider: new MemoryAnalyticsProvider(), isDbConfigured: () => false },
    );
    expect(res.status).toBe(422);
  });

  it('evaluates flags for a subject', async () => {
    const res = handleGetFlags({ subjectId: 'u1' });
    expect(res.status).toBe(200);
    const body = res.body as { flags: { key: string }[] };
    expect(body.flags.some((f) => f.key === 'referrals_enabled')).toBe(true);
    expect(handleGetFlags({ subjectId: null }).status).toBe(422);
  });
});

describe('referral handlers (DB + auth gated)', () => {
  function svc(): { service: ReferralService; repos: Repositories } {
    const repos = createInMemoryRepositories(repoDeps());
    return { service: new ReferralService({ repos }), repos };
  }

  it('503s without a database, and with the anonymous auth stub', async () => {
    expect(
      (await handleCreateReferralCode({ isDbConfigured: () => false })).status,
    ).toBe(503);
    expect(
      (
        await handleCreateReferralCode({
          isDbConfigured: () => true,
          identity: { userId: null, role: 'anon' },
        })
      ).status,
    ).toBe(503);
  });

  it('creates, claims, and reads referrals with a real identity', async () => {
    const { service } = svc();
    const created = await handleCreateReferralCode({
      isDbConfigured: () => true,
      identity: user,
      service,
    });
    expect(created.status).toBe(200);
    const code = (created.body as { code: string }).code;

    const claim = await handleClaimReferral(
      { code },
      { isDbConfigured: () => true, identity: other, service },
    );
    expect(claim.status).toBe(200);
    expect(claim.body).toMatchObject({ status: 'pending' });

    const mine = await handleMyReferrals({
      isDbConfigured: () => true,
      identity: user,
      service,
    });
    expect((mine.body as { stats: { total: number } }).stats.total).toBe(1);
  });

  it('422s a self-claim', async () => {
    const { service } = svc();
    const created = await handleCreateReferralCode({
      isDbConfigured: () => true,
      identity: user,
      service,
    });
    const code = (created.body as { code: string }).code;
    const res = await handleClaimReferral(
      { code },
      { isDbConfigured: () => true, identity: user, service },
    );
    expect(res.status).toBe(422);
  });
});

describe('handleGrowthDashboard', () => {
  it('503s without a DB or without elevated auth', async () => {
    expect(
      (await handleGrowthDashboard({ isDbConfigured: () => false })).status,
    ).toBe(503);
    expect(
      (
        await handleGrowthDashboard({
          isDbConfigured: () => true,
          identity: user,
        })
      ).status,
    ).toBe(503);
  });

  it('returns the dashboard for an admin', async () => {
    const repos = createInMemoryRepositories(repoDeps());
    const res = await handleGrowthDashboard({
      isDbConfigured: () => true,
      identity: admin,
      service: new GrowthService(repos),
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('dashboard');
  });
});
