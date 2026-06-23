/**
 * Stripe webhook handler (Phase 4). Verifies the signature, maps the event, and
 * advances the matching order through the state machine — granting an
 * entitlement (and marking the order fulfilled) on payment. Server-trusted: no
 * user identity (the service role owns these writes). Repos + secret injected,
 * so it is fully unit-tested with a real signature and in-memory repos.
 */

import type { Repositories } from '@/lib/db';
import { mapStripeEvent, type StripeEventLike } from './events';
import { canTransition, type OrderStatusValue } from './orders';
import { verifyWebhookSignature } from './signature';

export interface WebhookDeps {
  readonly repos: Repositories;
  readonly secret: string;
  readonly nowSec?: number;
}

export interface WebhookResult {
  readonly handled: boolean;
  readonly status: number;
  readonly reason?: string;
  readonly orderId?: string;
  readonly orderStatus?: OrderStatusValue;
}

function targetStatus(
  kind: 'paid' | 'refunded' | 'failed' | 'expired',
): OrderStatusValue {
  switch (kind) {
    case 'paid':
      return 'paid';
    case 'refunded':
      return 'refunded';
    case 'failed':
      return 'failed';
    case 'expired':
      return 'expired';
  }
}

export async function handleStripeWebhook(
  rawBody: string,
  signatureHeader: string,
  deps: WebhookDeps,
): Promise<WebhookResult> {
  const sig = verifyWebhookSignature(rawBody, signatureHeader, deps.secret, {
    nowSec: deps.nowSec,
  });
  if (!sig.ok) {
    return { handled: false, status: 400, reason: sig.reason };
  }

  let event: StripeEventLike;
  try {
    event = JSON.parse(rawBody) as StripeEventLike;
  } catch {
    return { handled: false, status: 400, reason: 'invalid JSON body' };
  }

  const mapped = mapStripeEvent(event);
  if (mapped.kind === 'ignored') {
    return { handled: true, status: 200, reason: 'event ignored' };
  }
  if (mapped.sessionId === undefined) {
    // e.g. refunds keyed by payment intent — acknowledged, reconciled elsewhere.
    return { handled: true, status: 200, reason: 'no session reference' };
  }

  const order = await deps.repos.orders.findByStripeSessionId(mapped.sessionId);
  if (order === null) {
    return { handled: true, status: 200, reason: 'no matching order' };
  }

  const target = targetStatus(mapped.kind);
  if (!canTransition(order.status, target)) {
    return {
      handled: true,
      status: 200,
      reason: `no-op transition ${order.status} -> ${target}`,
      orderId: order.id,
      orderStatus: order.status,
    };
  }

  await deps.repos.orders.update(order.id, {
    status: target,
    ...(mapped.paymentIntentId !== undefined
      ? { stripePaymentIntentId: mapped.paymentIntentId }
      : {}),
  });

  if (target === 'paid') {
    await deps.repos.entitlements.create({
      userId: order.userId,
      sku: order.tier,
      reportId: order.reportId,
      orderId: order.id,
      source: 'purchase',
    });
    await deps.repos.orders.update(order.id, { status: 'fulfilled' });
    await deps.repos.auditLogs.create({
      actorUserId: order.userId,
      action: 'order.fulfilled',
      entityType: 'order',
      entityId: order.id,
      metadata: { tier: order.tier, amountCents: order.amountCents },
    });
    return {
      handled: true,
      status: 200,
      orderId: order.id,
      orderStatus: 'fulfilled',
    };
  }

  return { handled: true, status: 200, orderId: order.id, orderStatus: target };
}
