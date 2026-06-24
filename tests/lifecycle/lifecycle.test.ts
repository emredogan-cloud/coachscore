import { beforeEach, describe, expect, it } from 'vitest';
import { createInMemoryRepositories } from '@/lib/db';
import type { LifecycleMessageRow, Repositories, RepoDeps } from '@/lib/db';
import {
  abandonedCheckoutRule,
  LifecycleService,
  onboardingRule,
  planLifecycle,
  retentionRule,
  winbackRule,
  type LifecycleDeliverer,
  type LifecycleState,
} from '@/lib/lifecycle';

function deps(): RepoDeps {
  let n = 0;
  return {
    idGen: () => `id-${++n}`,
    now: () => new Date('2026-06-24T12:00:00.000Z'),
  };
}

const NOW = new Date('2026-06-24T12:00:00.000Z');

describe('lifecycle rules', () => {
  it('schedules a D1 onboarding nudge only after a day without purchase', () => {
    const base: LifecycleState = {
      userId: 'u1',
      teaserCompletedAt: new Date('2026-06-20T12:00:00.000Z'),
      hasPurchased: false,
    };
    expect(onboardingRule.evaluate(base, NOW)?.kind).toBe(
      'onboarding_reminder',
    );
    expect(
      onboardingRule.evaluate({ ...base, hasPurchased: true }, NOW),
    ).toBeNull();
    expect(
      onboardingRule.evaluate(
        { ...base, teaserCompletedAt: new Date('2026-06-24T06:00:00.000Z') },
        NOW,
      ),
    ).toBeNull();
  });

  it('fires abandoned-checkout, retention (D7), and winback (D30)', () => {
    expect(
      abandonedCheckoutRule.evaluate(
        {
          userId: 'u1',
          checkoutStartedAt: new Date('2026-06-24T10:00:00.000Z'),
          hasPurchased: false,
        },
        NOW,
      )?.kind,
    ).toBe('abandoned_checkout');
    expect(
      retentionRule.evaluate(
        {
          userId: 'u1',
          hasPurchased: true,
          lastPurchaseAt: new Date('2026-06-15T12:00:00.000Z'),
        },
        NOW,
      )?.kind,
    ).toBe('retention');
    expect(
      winbackRule.evaluate(
        {
          userId: 'u1',
          hasPurchased: true,
          lastActiveAt: new Date('2026-05-10T12:00:00.000Z'),
        },
        NOW,
      )?.kind,
    ).toBe('winback');
  });

  it('drops plans with no deliverable subject', () => {
    const plans = planLifecycle(
      {
        userId: null,
        anonId: null,
        teaserCompletedAt: new Date('2026-06-20T12:00:00.000Z'),
        hasPurchased: false,
      },
      NOW,
    );
    expect(plans).toHaveLength(0);
  });
});

const alwaysDeliver: LifecycleDeliverer = {
  async deliver() {
    return { delivered: true };
  },
};
const neverDeliver: LifecycleDeliverer = {
  async deliver() {
    return { delivered: false, reason: 'bounced' };
  },
};

describe('LifecycleService', () => {
  let repos: Repositories;
  const state: LifecycleState = {
    userId: 'u1',
    teaserCompletedAt: new Date('2026-06-20T12:00:00.000Z'),
    hasPurchased: false,
  };
  beforeEach(() => {
    repos = createInMemoryRepositories(deps());
  });

  it('schedules due messages once (deduped on re-plan)', async () => {
    const svc = new LifecycleService({ repos, now: () => NOW });
    const first = await svc.plan(state);
    expect(first.length).toBeGreaterThanOrEqual(1);
    const second = await svc.plan(state);
    expect(second).toHaveLength(0);
    const scheduled = await repos.lifecycleMessages.listByStatus('scheduled');
    expect(scheduled.length).toBe(first.length);
  });

  it('leaves messages scheduled when delivery is not activated', async () => {
    const svc = new LifecycleService({ repos, now: () => NOW });
    await svc.plan(state);
    const result = await svc.dispatchDue();
    expect(result.sent).toBe(0);
    expect(result.pending).toBeGreaterThanOrEqual(1);
    expect(
      (await repos.lifecycleMessages.listByStatus('scheduled')).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('delivers due messages when a deliverer is present', async () => {
    const svc = new LifecycleService({
      repos,
      now: () => NOW,
      deliverer: alwaysDeliver,
    });
    await svc.plan(state);
    const result = await svc.dispatchDue();
    expect(result.sent).toBeGreaterThanOrEqual(1);
    const sent: LifecycleMessageRow[] =
      await repos.lifecycleMessages.listByStatus('sent');
    expect(sent[0]?.sentAt).not.toBeNull();
  });

  it('marks failed deliveries', async () => {
    const svc = new LifecycleService({
      repos,
      now: () => NOW,
      deliverer: neverDeliver,
    });
    await svc.plan(state);
    const result = await svc.dispatchDue();
    expect(result.failed).toBeGreaterThanOrEqual(1);
    expect(
      (await repos.lifecycleMessages.listByStatus('failed')).length,
    ).toBeGreaterThanOrEqual(1);
  });
});
