/**
 * Live payment/webhook wiring (Phase 4) — the activation boundary.
 *
 * Resolves the real Stripe provider + Drizzle repositories and binds the webhook
 * secret. Throws until the credentials exist. Exercised at activation; the API
 * handlers inject fakes in tests, so this file is outside coverage.
 */

import { createDrizzleRepositories, type Repositories } from '@/lib/db';
import { requireEnv } from '@/lib/env';
import {
  createStripeProvider,
  handleStripeWebhook,
  type PaymentProvider,
  type WebhookResult,
} from '@/lib/payments';

export function resolveProvider(): PaymentProvider {
  return createStripeProvider();
}

export function resolveRepos(): Repositories {
  return createDrizzleRepositories();
}

export function defaultWebhookHandle(
  rawBody: string,
  signatureHeader: string,
): Promise<WebhookResult> {
  return handleStripeWebhook(rawBody, signatureHeader, {
    repos: createDrizzleRepositories(),
    secret: requireEnv('STRIPE_WEBHOOK_SECRET'),
  });
}
