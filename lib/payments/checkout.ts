/**
 * Checkout orchestration (Phase 4). Creates a pending order, asks the payment
 * provider for a checkout session, and records the session id on the order.
 * Provider + repositories are injected, so the flow is unit-tested with a fake
 * provider + in-memory repos (no Stripe credential, no network).
 */

import type { Repositories } from '@/lib/db';
import {
  getTier,
  isPurchasable,
  priceForQuantity,
  type SkuId,
} from '@/lib/pricing';
import { getProduct, type ProductSku } from '@/lib/products';
import type { PaymentProvider } from './types';

export interface CreateCheckoutInput {
  readonly sku: SkuId;
  readonly quantity?: number;
  readonly userId?: string | null;
  readonly reportId?: string | null;
  readonly successUrl: string;
  readonly cancelUrl: string;
  readonly customerEmail?: string;
}

export interface CreateCheckoutResult {
  readonly orderId: string;
  readonly sessionId: string;
  readonly url: string;
  readonly amountCents: number;
}

export interface CheckoutDeps {
  readonly provider: PaymentProvider;
  readonly repos: Repositories;
}

export class NotPurchasableError extends Error {
  constructor(sku: SkuId) {
    super(`SKU "${sku}" is not purchasable.`);
    this.name = 'NotPurchasableError';
  }
}

export async function createCheckout(
  input: CreateCheckoutInput,
  deps: CheckoutDeps,
): Promise<CreateCheckoutResult> {
  if (!isPurchasable(input.sku)) {
    throw new NotPurchasableError(input.sku);
  }
  const tier = getTier(input.sku);
  const quantity = tier.perSeat
    ? Math.max(tier.minSeats ?? 1, input.quantity ?? 1)
    : 1;
  const amountCents = priceForQuantity(tier, input.quantity ?? 1);

  const order = await deps.repos.orders.create({
    userId: input.userId ?? null,
    reportId: input.reportId ?? null,
    tier: input.sku,
    quantity,
    amountCents,
    currency: tier.currency,
    status: 'pending',
  });

  const session = await deps.provider.createCheckoutSession({
    productName: `CoachScore ${tier.name}`,
    unitAmountCents: tier.priceUsdCents,
    currency: tier.currency,
    quantity,
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    clientReferenceId: order.id,
    customerEmail: input.customerEmail,
    sku: input.sku,
  });

  await deps.repos.orders.update(order.id, {
    stripeSessionId: session.sessionId,
  });

  return {
    orderId: order.id,
    sessionId: session.sessionId,
    url: session.url,
    amountCents,
  };
}

export interface CreateProductCheckoutInput {
  readonly sku: ProductSku;
  readonly userId?: string | null;
  readonly successUrl: string;
  readonly cancelUrl: string;
  readonly customerEmail?: string;
}

/**
 * Checkout for a Phase-6 product SKU (ReplayDoctor / BaseDoctor / WarPlan).
 * Reuses the same provider + order machinery as report checkout, but prices
 * from the product catalog and records the purchase on `orders.productSku`
 * (the report-tier column stays null for product orders).
 */
export async function createProductCheckout(
  input: CreateProductCheckoutInput,
  deps: CheckoutDeps,
): Promise<CreateCheckoutResult> {
  const product = getProduct(input.sku);

  const order = await deps.repos.orders.create({
    userId: input.userId ?? null,
    reportId: null,
    productSku: input.sku,
    quantity: 1,
    amountCents: product.priceUsdCents,
    currency: 'usd',
    status: 'pending',
  });

  const session = await deps.provider.createCheckoutSession({
    productName: `CoachScore ${product.name}`,
    unitAmountCents: product.priceUsdCents,
    currency: 'usd',
    quantity: 1,
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    clientReferenceId: order.id,
    customerEmail: input.customerEmail,
    sku: input.sku,
  });

  await deps.repos.orders.update(order.id, {
    stripeSessionId: session.sessionId,
  });

  return {
    orderId: order.id,
    sessionId: session.sessionId,
    url: session.url,
    amountCents: product.priceUsdCents,
  };
}
