import { beforeEach, describe, expect, it } from 'vitest';
import { createInMemoryRepositories } from '@/lib/db';
import type { Repositories, RepoDeps } from '@/lib/db';
import { AuthorizationError } from '@/lib/auth';
import type { Identity } from '@/lib/auth';
import { AnalyticsService, MemoryAnalyticsProvider } from '@/lib/analytics';
import {
  computeReward,
  generateReferralCode,
  isValidReferralCode,
  parseReferralParam,
  ReferralError,
  ReferralService,
} from '@/lib/referrals';

function deps(): RepoDeps {
  let n = 0;
  return {
    idGen: () => `id-${++n}`,
    now: () => new Date('2026-06-24T00:00:00.000Z'),
  };
}

const alice: Identity = { userId: 'alice', role: 'user' };
const bob: Identity = { userId: 'bob', role: 'user' };
const anon: Identity = { userId: null, role: 'anon' };

describe('referral codes + rewards + attribution', () => {
  it('generates a deterministic, valid code', () => {
    const code = generateReferralCode('alice');
    expect(code).toBe(generateReferralCode('alice'));
    expect(isValidReferralCode(code)).toBe(true);
    expect(code.startsWith('CS')).toBe(true);
  });

  it('computes a capped referrer credit + flat referee discount', () => {
    expect(computeReward(1200)).toEqual({
      referrerCents: 240,
      refereeCents: 200,
    });
    expect(computeReward(100000).referrerCents).toBe(500); // capped
  });

  it('parses a referral code from bare / ?ref= / /r/ forms', () => {
    const code = generateReferralCode('alice');
    expect(parseReferralParam(code)).toBe(code);
    expect(parseReferralParam(`https://x.app/?ref=${code}`)).toBe(code);
    expect(parseReferralParam(`https://x.app/r/${code}`)).toBe(code);
    expect(parseReferralParam('garbage')).toBeNull();
    expect(parseReferralParam(null)).toBeNull();
  });
});

describe('ReferralService', () => {
  let repos: Repositories;
  let sink: MemoryAnalyticsProvider;
  let svc: ReferralService;
  beforeEach(() => {
    repos = createInMemoryRepositories(deps());
    sink = new MemoryAnalyticsProvider();
    svc = new ReferralService({
      repos,
      analytics: new AnalyticsService({ provider: sink }),
      now: () => new Date('2026-06-24T12:00:00.000Z'),
    });
  });

  it('creates one stable code per user', async () => {
    const a = await svc.createCode(alice);
    const again = await svc.createCode(alice);
    expect(again.code).toBe(a.code);
    expect(
      sink.events.filter((e) => e.name === 'referral_code_created'),
    ).toHaveLength(1);
  });

  it('runs claim → qualify and computes the reward', async () => {
    const code = await svc.createCode(alice);
    const referral = await svc.claim(bob, code.code);
    expect(referral.status).toBe('pending');
    expect(referral.referrerUserId).toBe('alice');

    const qualified = await svc.qualify({
      refereeUserId: 'bob',
      orderId: 'order-1',
      orderAmountCents: 1200,
    });
    expect(qualified?.status).toBe('qualified');
    expect(qualified?.rewardCents).toBe(240);
    expect(qualified?.attributedOrderId).toBe('order-1');

    const mine = await svc.listMine(alice);
    expect(mine.stats.qualified).toBe(1);
    expect(mine.stats.rewardCents).toBe(240);
  });

  it('guards self-claim, bad codes, and double-claim', async () => {
    const code = await svc.createCode(alice);
    await expect(svc.claim(alice, code.code)).rejects.toBeInstanceOf(
      ReferralError,
    );
    await expect(svc.claim(bob, 'CSZZZZZZ')).rejects.toBeInstanceOf(
      ReferralError,
    );
    await svc.claim(bob, code.code);
    await expect(svc.claim(bob, code.code)).rejects.toBeInstanceOf(
      ReferralError,
    );
  });

  it('returns null qualifying a user with no pending referral', async () => {
    expect(
      await svc.qualify({ refereeUserId: 'nobody', orderAmountCents: 700 }),
    ).toBeNull();
  });

  it('denies anonymous callers', async () => {
    await expect(svc.createCode(anon)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
    await expect(svc.listMine(anon)).rejects.toBeInstanceOf(AuthorizationError);
  });
});
