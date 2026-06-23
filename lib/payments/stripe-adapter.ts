/**
 * Stripe payment provider (Phase 4) — the real HTTP I/O boundary, NOT activated.
 *
 * Implements `PaymentProvider` against the Stripe REST API via `fetch` (no SDK
 * dependency) using inline `price_data` so no pre-created Stripe price ids are
 * needed. `createStripeProvider` refuses to build until `STRIPE_SECRET_KEY` is
 * present. Exercised once Stripe is provisioned; not unit-tested (handlers inject
 * a fake provider, and signature/state logic is tested purely).
 */

import { isPaymentsConfigured } from '@/lib/activation';
import { requireEnv } from '@/lib/env';
import type { CheckoutInput, CheckoutSession, PaymentProvider } from './types';

export class PaymentsNotConfiguredError extends Error {
  constructor() {
    super(
      'Stripe payments are not activated: set STRIPE_SECRET_KEY (+ ' +
        'STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) to enable.',
    );
    this.name = 'PaymentsNotConfiguredError';
  }
}

export class NotConfiguredPaymentProvider implements PaymentProvider {
  async createCheckoutSession(): Promise<CheckoutSession> {
    throw new PaymentsNotConfiguredError();
  }
}

const STRIPE_CHECKOUT_URL = 'https://api.stripe.com/v1/checkout/sessions';

export class StripePaymentProvider implements PaymentProvider {
  constructor(
    private readonly secretKey: string = requireEnv('STRIPE_SECRET_KEY'),
  ) {}

  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession> {
    const body = new URLSearchParams();
    body.set('mode', 'payment');
    body.set('success_url', input.successUrl);
    body.set('cancel_url', input.cancelUrl);
    body.set('line_items[0][quantity]', String(input.quantity));
    body.set('line_items[0][price_data][currency]', input.currency);
    body.set(
      'line_items[0][price_data][unit_amount]',
      String(input.unitAmountCents),
    );
    body.set(
      'line_items[0][price_data][product_data][name]',
      input.productName,
    );
    if (input.clientReferenceId !== undefined) {
      body.set('client_reference_id', input.clientReferenceId);
    }
    if (input.customerEmail !== undefined) {
      body.set('customer_email', input.customerEmail);
    }

    const response = await fetch(STRIPE_CHECKOUT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    if (!response.ok) {
      throw new Error(
        `Stripe checkout session failed: HTTP ${response.status}`,
      );
    }
    const json = (await response.json()) as { id: string; url: string | null };
    return { sessionId: json.id, url: json.url ?? '' };
  }
}

/** Build the production Stripe provider; throws until the secret key is set. */
export function createStripeProvider(): PaymentProvider {
  if (!isPaymentsConfigured()) {
    throw new PaymentsNotConfiguredError();
  }
  return new StripePaymentProvider();
}
