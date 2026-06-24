/**
 * Payout service (Phase 5). Orchestrates coach Connect onboarding + transfers
 * over an injected `PayoutProvider` + repositories — so the flow is unit-tested
 * with a fake provider + in-memory repos. The live Stripe Connect provider is
 * resolved only at the API boundary (gated on credentials).
 */

import type { Payout, PayoutAccount, Repositories } from '@/lib/db';
import type { PayoutProvider } from './types';

export class PayoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PayoutError';
  }
}

function orThrow<T>(value: T | null, message: string): T {
  if (value === null) throw new PayoutError(message);
  return value;
}

export interface PayoutServiceDeps {
  readonly provider: PayoutProvider;
  readonly repos: Repositories;
}

export interface OnboardingResult {
  readonly payoutAccountId: string;
  readonly externalAccountId: string;
  readonly url: string;
}

export class PayoutService {
  constructor(private readonly deps: PayoutServiceDeps) {}

  async startOnboarding(
    coachId: string,
    urls: { refreshUrl: string; returnUrl: string; email?: string },
  ): Promise<OnboardingResult> {
    const account = await this.deps.provider.createConnectedAccount({
      coachId,
      email: urls.email,
    });
    const existing = await this.deps.repos.payoutAccounts.findByCoach(coachId);
    const payoutAccount =
      existing === null
        ? await this.deps.repos.payoutAccounts.create({
            coachId,
            provider: 'stripe_connect',
            externalAccountId: account.accountId,
            status: 'onboarding',
          })
        : orThrow(
            await this.deps.repos.payoutAccounts.update(existing.id, {
              externalAccountId: account.accountId,
              status: 'onboarding',
            }),
            'Payout account not found.',
          );
    const link = await this.deps.provider.createAccountLink(account.accountId, {
      refreshUrl: urls.refreshUrl,
      returnUrl: urls.returnUrl,
    });
    return {
      payoutAccountId: payoutAccount.id,
      externalAccountId: account.accountId,
      url: link.url,
    };
  }

  async markAccountActive(coachId: string): Promise<PayoutAccount> {
    const account = orThrow(
      await this.deps.repos.payoutAccounts.findByCoach(coachId),
      'No payout account for this coach.',
    );
    return orThrow(
      await this.deps.repos.payoutAccounts.update(account.id, {
        status: 'active',
      }),
      'Payout account not found.',
    );
  }

  async executePayout(payoutId: string): Promise<Payout> {
    const payout = orThrow(
      await this.deps.repos.payouts.findById(payoutId),
      'Payout not found.',
    );
    if (payout.status !== 'pending') {
      throw new PayoutError(
        `Payout is not pending (status: ${payout.status}).`,
      );
    }
    const account = orThrow(
      await this.deps.repos.payoutAccounts.findByCoach(payout.coachId),
      'Coach has no payout account.',
    );
    if (account.status !== 'active' || account.externalAccountId === null) {
      throw new PayoutError('Coach payout account is not active.');
    }
    const transfer = await this.deps.provider.createTransfer({
      destinationAccountId: account.externalAccountId,
      amountCents: payout.amountCents,
      currency: payout.currency,
      description: `CoachScore payout ${payout.id}`,
    });
    return orThrow(
      await this.deps.repos.payouts.update(payoutId, {
        status: 'paid',
        externalPayoutId: transfer.transferId,
      }),
      'Payout not found.',
    );
  }
}
