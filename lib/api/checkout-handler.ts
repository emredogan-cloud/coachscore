/**
 * Checkout handler (Phase 4). Validates the SKU, gates on payments+DB
 * activation, and creates a Stripe checkout session via the payments lib.
 * Provider/repos/activation are injectable, so the logic is unit-tested with a
 * fake provider + in-memory repos; the live path resolves real Stripe + Drizzle.
 */

import { z } from 'zod';
import { isDatabaseConfigured, isPaymentsConfigured } from '@/lib/activation';
import { appConfig } from '@/lib/env';
import type { Repositories } from '@/lib/db';
import { createCheckout, type PaymentProvider } from '@/lib/payments';
import { isPurchasable, SKU_IDS } from '@/lib/pricing';
import { errorToResult, NotActivatedError, ValidationError } from './errors';
import type { HandlerResult } from './intake-handler';
import { resolveProvider, resolveRepos } from './payment-wire';

const CheckoutRequestSchema = z.object({
  sku: z.enum(SKU_IDS),
  quantity: z.number().int().min(1).max(1000).optional(),
  customerEmail: z.string().email().optional(),
  reportId: z.string().optional(),
});

export interface CheckoutHandlerDeps {
  readonly isActivated?: () => boolean;
  readonly provider?: PaymentProvider;
  readonly repos?: Repositories;
  readonly appUrl?: string;
}

export async function handleCheckout(
  rawBody: unknown,
  deps: CheckoutHandlerDeps = {},
): Promise<HandlerResult> {
  const parsed = CheckoutRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorToResult(
      new ValidationError(
        'Invalid checkout request body.',
        parsed.error.flatten(),
      ),
    );
  }
  if (!isPurchasable(parsed.data.sku)) {
    return errorToResult(
      new ValidationError(`SKU "${parsed.data.sku}" is not purchasable.`),
    );
  }

  const activated = (
    deps.isActivated ?? (() => isPaymentsConfigured() && isDatabaseConfigured())
  )();
  if (!activated) {
    return errorToResult(
      new NotActivatedError(
        'Payments are not activated: set STRIPE_SECRET_KEY (+ webhook secret) ' +
          'and DATABASE_URL.',
      ),
    );
  }

  const appUrl = deps.appUrl ?? appConfig.url;
  const provider = deps.provider ?? resolveProvider();
  const repos = deps.repos ?? resolveRepos();

  const result = await createCheckout(
    {
      sku: parsed.data.sku,
      quantity: parsed.data.quantity,
      customerEmail: parsed.data.customerEmail,
      reportId: parsed.data.reportId ?? null,
      successUrl: `${appUrl}/report?status=success`,
      cancelUrl: `${appUrl}/pricing?status=cancelled`,
    },
    { provider, repos },
  );

  return {
    status: 200,
    body: {
      orderId: result.orderId,
      url: result.url,
      amountCents: result.amountCents,
    },
  };
}
