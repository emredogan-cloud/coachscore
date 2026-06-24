import { describe, expect, it } from 'vitest';
import { createInMemoryRepositories } from '@/lib/db';
import type { RepoDeps } from '@/lib/db';
import { PayoutError, PayoutService, type PayoutProvider } from '@/lib/payouts';

function deps(): RepoDeps {
  let n = 0;
  return {
    idGen: () => `id-${++n}`,
    now: () => new Date('2026-06-24T00:00:00.000Z'),
  };
}

const provider: PayoutProvider = {
  async createConnectedAccount() {
    return { accountId: 'acct_1', status: 'onboarding' };
  },
  async createAccountLink() {
    return { url: 'https://connect.stripe.test/onboard' };
  },
  async createTransfer() {
    return { transferId: 'tr_1' };
  },
};

describe('PayoutService onboarding', () => {
  it('creates a connected account + payout account + onboarding link', async () => {
    const repos = createInMemoryRepositories(deps());
    const svc = new PayoutService({ provider, repos });
    const result = await svc.startOnboarding('c1', {
      refreshUrl: 'r',
      returnUrl: 'ret',
    });
    expect(result.externalAccountId).toBe('acct_1');
    expect(result.url).toBe('https://connect.stripe.test/onboard');
    const account = await repos.payoutAccounts.findByCoach('c1');
    expect(account?.status).toBe('onboarding');

    // Idempotent: a second onboarding updates the existing account.
    await svc.startOnboarding('c1', { refreshUrl: 'r', returnUrl: 'ret' });
    const all = await repos.payoutAccounts.findByCoach('c1');
    expect(all?.externalAccountId).toBe('acct_1');

    const active = await svc.markAccountActive('c1');
    expect(active.status).toBe('active');
  });
});

describe('PayoutService executePayout', () => {
  it('transfers a pending payout once the account is active', async () => {
    const repos = createInMemoryRepositories(deps());
    const svc = new PayoutService({ provider, repos });
    await svc.startOnboarding('c1', { refreshUrl: 'r', returnUrl: 'ret' });
    await svc.markAccountActive('c1');
    const payout = await repos.payouts.create({
      coachId: 'c1',
      amountCents: 720,
    });

    const paid = await svc.executePayout(payout.id);
    expect(paid.status).toBe('paid');
    expect(paid.externalPayoutId).toBe('tr_1');
  });

  it('refuses a non-pending payout and an inactive account', async () => {
    const repos = createInMemoryRepositories(deps());
    const svc = new PayoutService({ provider, repos });
    // No payout account → inactive.
    const p = await repos.payouts.create({ coachId: 'c9', amountCents: 100 });
    await expect(svc.executePayout(p.id)).rejects.toThrow(PayoutError);

    await svc.startOnboarding('c1', { refreshUrl: 'r', returnUrl: 'ret' });
    await svc.markAccountActive('c1');
    const paid = await repos.payouts.create({
      coachId: 'c1',
      amountCents: 50,
      status: 'paid',
    });
    await expect(svc.executePayout(paid.id)).rejects.toThrow(PayoutError);
    await expect(svc.executePayout('missing')).rejects.toThrow(PayoutError);
  });
});
