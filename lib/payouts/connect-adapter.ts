/**
 * Stripe Connect payout provider (Phase 5) — the real HTTP I/O boundary, NOT
 * activated. Express connected accounts + account links + transfers via the
 * Stripe REST API (`fetch`, no SDK). `createStripeConnectProvider` refuses to
 * build until Stripe is provisioned. Exercised at activation; the payout service
 * injects a fake provider in tests.
 */

import { isPaymentsConfigured } from '@/lib/activation';
import { optionalEnv, requireEnv } from '@/lib/env';
import type {
  AccountLink,
  ConnectedAccount,
  PayoutProvider,
  TransferInput,
  TransferResult,
} from './types';

export class PayoutsNotConfiguredError extends Error {
  constructor() {
    super(
      'Stripe Connect payouts are not activated: set STRIPE_SECRET_KEY (+ ' +
        'STRIPE_CONNECT_CLIENT_ID) to enable coach payouts.',
    );
    this.name = 'PayoutsNotConfiguredError';
  }
}

export class NotConfiguredPayoutProvider implements PayoutProvider {
  async createConnectedAccount(): Promise<ConnectedAccount> {
    throw new PayoutsNotConfiguredError();
  }
  async createAccountLink(): Promise<AccountLink> {
    throw new PayoutsNotConfiguredError();
  }
  async createTransfer(): Promise<TransferResult> {
    throw new PayoutsNotConfiguredError();
  }
}

const STRIPE = 'https://api.stripe.com/v1';

async function stripePost(
  path: string,
  secretKey: string,
  body: URLSearchParams,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${STRIPE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`Stripe Connect ${path} failed: HTTP ${res.status}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

export class StripeConnectProvider implements PayoutProvider {
  constructor(
    private readonly secretKey: string = requireEnv('STRIPE_SECRET_KEY'),
  ) {}

  async createConnectedAccount(input: {
    coachId: string;
    email?: string;
  }): Promise<ConnectedAccount> {
    const body = new URLSearchParams();
    body.set('type', 'express');
    body.set('metadata[coachId]', input.coachId);
    if (input.email !== undefined) body.set('email', input.email);
    const json = await stripePost('/accounts', this.secretKey, body);
    return { accountId: String(json.id ?? ''), status: 'onboarding' };
  }

  async createAccountLink(
    accountId: string,
    urls: { refreshUrl: string; returnUrl: string },
  ): Promise<AccountLink> {
    const body = new URLSearchParams();
    body.set('account', accountId);
    body.set('refresh_url', urls.refreshUrl);
    body.set('return_url', urls.returnUrl);
    body.set('type', 'account_onboarding');
    const json = await stripePost('/account_links', this.secretKey, body);
    return { url: String(json.url ?? '') };
  }

  async createTransfer(input: TransferInput): Promise<TransferResult> {
    const body = new URLSearchParams();
    body.set('amount', String(input.amountCents));
    body.set('currency', input.currency);
    body.set('destination', input.destinationAccountId);
    if (input.description !== undefined) {
      body.set('description', input.description);
    }
    const json = await stripePost('/transfers', this.secretKey, body);
    return { transferId: String(json.id ?? '') };
  }
}

/** The Connect client id (Standard OAuth); Express accounts don't require it. */
export function connectClientId(): string {
  return optionalEnv('STRIPE_CONNECT_CLIENT_ID', '');
}

export function createStripeConnectProvider(): PayoutProvider {
  if (!isPaymentsConfigured()) {
    throw new PayoutsNotConfiguredError();
  }
  return new StripeConnectProvider();
}
