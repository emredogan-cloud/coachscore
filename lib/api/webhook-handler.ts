/**
 * Stripe webhook API handler (Phase 4). Gates on payments+DB activation, then
 * delegates to the payments webhook (signature verify → order transition →
 * entitlement). Activation + delegate are injectable for tests; the live path
 * resolves real Drizzle repos + the webhook secret.
 */

import { isDatabaseConfigured, isPaymentsConfigured } from '@/lib/activation';
import type { WebhookResult } from '@/lib/payments';
import { errorToResult, NotActivatedError, ValidationError } from './errors';
import type { HandlerResult } from './intake-handler';
import { defaultWebhookHandle } from './payment-wire';

export interface WebhookApiDeps {
  readonly isActivated?: () => boolean;
  readonly handle?: (rawBody: string, sig: string) => Promise<WebhookResult>;
}

export async function handleStripeWebhookRequest(
  rawBody: string,
  signatureHeader: string | null,
  deps: WebhookApiDeps = {},
): Promise<HandlerResult> {
  const activated = (
    deps.isActivated ?? (() => isPaymentsConfigured() && isDatabaseConfigured())
  )();
  if (!activated) {
    return errorToResult(
      new NotActivatedError(
        'Stripe webhook is not activated: set STRIPE_SECRET_KEY, ' +
          'STRIPE_WEBHOOK_SECRET and DATABASE_URL.',
      ),
    );
  }
  if (signatureHeader === null) {
    return errorToResult(
      new ValidationError('Missing Stripe-Signature header.'),
    );
  }

  const result = await (deps.handle ?? defaultWebhookHandle)(
    rawBody,
    signatureHeader,
  );
  return {
    status: result.status,
    body: {
      received: result.handled,
      orderStatus: result.orderStatus ?? null,
      reason: result.reason ?? null,
    },
  };
}
