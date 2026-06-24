import { beforeEach, describe, expect, it } from 'vitest';
import { createInMemoryRepositories } from '@/lib/db';
import type { Repositories, RepoDeps } from '@/lib/db';
import { AnalyticsService, MemoryAnalyticsProvider } from '@/lib/analytics';
import { ExperimentService } from '@/lib/experiments';
import { ReferralService } from '@/lib/referrals';
import { GrowthService, kpiSummary, referralMetrics } from '@/lib/growth';

function deps(): RepoDeps {
  let n = 0;
  return {
    idGen: () => `id-${++n}`,
    now: () => new Date('2026-06-24T00:00:00.000Z'),
  };
}

describe('pure metric helpers', () => {
  it('kpiSummary handles an empty stream without dividing by zero', () => {
    expect(kpiSummary([])).toMatchObject({ teaserToPaid: 0, visitToTeaser: 0 });
  });

  it('referralMetrics computes a K-factor', () => {
    const base = {
      id: 'r',
      codeId: 'c',
      refereeUserId: null,
      attributedOrderId: null,
      createdAt: new Date(),
      qualifiedAt: null,
      rewardCents: 0,
    };
    const m = referralMetrics([
      { ...base, referrerUserId: 'a', status: 'qualified', rewardCents: 240 },
      { ...base, referrerUserId: 'a', status: 'pending' },
      { ...base, referrerUserId: 'b', status: 'qualified' },
    ]);
    expect(m.referrers).toBe(2);
    expect(m.qualified).toBe(2);
    expect(m.kFactor).toBe(1); // 2 qualified / 2 referrers
  });
});

describe('GrowthService dashboard (end-to-end via services)', () => {
  let repos: Repositories;
  beforeEach(() => {
    repos = createInMemoryRepositories(deps());
  });

  it('aggregates funnels, experiments, and referrals from persisted rows', async () => {
    const analytics = new AnalyticsService({
      provider: new MemoryAnalyticsProvider(),
      repo: repos.analyticsEvents,
    });
    const fire = async (name: string, n: number) => {
      for (let i = 0; i < n; i++) {
        await analytics.track({ name, context: { anonId: `${name}-${i}` } });
      }
    };
    await fire('landing_viewed', 10);
    await fire('teaser_completed', 5);
    await fire('report_delivered', 2);

    const experiments = new ExperimentService({
      repo: repos.experimentAssignments,
    });
    for (let i = 0; i < 6; i++) {
      await experiments.assign(`subj-${i}`, 'teaser_reveal_depth');
    }

    const referrals = new ReferralService({ repos });
    const code = await referrals.createCode({ userId: 'alice', role: 'user' });
    await referrals.claim({ userId: 'bob', role: 'user' }, code.code);
    await referrals.qualify({ refereeUserId: 'bob', orderAmountCents: 1200 });

    const dashboard = await new GrowthService(repos).dashboard();
    expect(dashboard.kpis.visitToTeaser).toBe(0.5);
    expect(dashboard.kpis.teaserToPaid).toBe(0.4);
    const acq = dashboard.funnels.find((f) => f.key === 'acquisition');
    expect(acq?.steps[0]?.count).toBe(10);
    expect(
      dashboard.experiments.find(
        (e) => e.experimentKey === 'teaser_reveal_depth',
      )?.total,
    ).toBe(6);
    expect(dashboard.referrals.qualified).toBe(1);
    expect(dashboard.referrals.rewardCents).toBe(240);
  });
});
