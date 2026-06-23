import { describe, expect, it } from 'vitest';
import { createInMemoryRepositories } from '@/lib/db';
import type { RepoDeps } from '@/lib/db';
import {
  assertTransition,
  canTransition,
  computeSignature,
  createCheckout,
  handleStripeWebhook,
  InvalidOrderTransitionError,
  mapStripeEvent,
  NotPurchasableError,
  verifyWebhookSignature,
  type PaymentProvider,
} from '@/lib/payments';

function deps(): RepoDeps {
  let n = 0;
  return {
    idGen: () => `id-${++n}`,
    now: () => new Date('2026-06-24T00:00:00.000Z'),
  };
}

const fakeProvider = (sessionId = 'cs_test_1'): PaymentProvider => ({
  async createCheckoutSession() {
    return { sessionId, url: `https://stripe.test/${sessionId}` };
  },
});

const SECRET = 'whsec_test';
const sign = (payload: string, t = '1000'): string =>
  `t=${t},v1=${computeSignature(payload, t, SECRET)}`;

describe('webhook signature', () => {
  const payload = '{"a":1}';
  it('accepts a valid, recent signature', () => {
    const check = verifyWebhookSignature(payload, sign(payload), SECRET, {
      nowSec: 1000,
    });
    expect(check.ok).toBe(true);
  });
  it('rejects a tampered payload', () => {
    const check = verifyWebhookSignature(`${payload} `, sign(payload), SECRET, {
      nowSec: 1000,
    });
    expect(check.ok).toBe(false);
    expect(check.reason).toBe('signature mismatch');
  });
  it('rejects a stale timestamp', () => {
    const check = verifyWebhookSignature(payload, sign(payload), SECRET, {
      nowSec: 999_999,
    });
    expect(check.ok).toBe(false);
    expect(check.reason).toBe('timestamp outside tolerance');
  });
  it('rejects a malformed header', () => {
    expect(verifyWebhookSignature(payload, 'garbage', SECRET).ok).toBe(false);
  });
});

describe('order state machine', () => {
  it('allows legal transitions and blocks illegal ones', () => {
    expect(canTransition('pending', 'paid')).toBe(true);
    expect(canTransition('paid', 'fulfilled')).toBe(true);
    expect(canTransition('refunded', 'paid')).toBe(false);
    expect(canTransition('fulfilled', 'paid')).toBe(false);
    expect(() => assertTransition('pending', 'paid')).not.toThrow();
    expect(() => assertTransition('refunded', 'paid')).toThrow(
      InvalidOrderTransitionError,
    );
  });
});

describe('stripe event mapping', () => {
  it('maps the events we act on', () => {
    expect(
      mapStripeEvent({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_1', payment_intent: 'pi_1' } },
      }),
    ).toEqual({ kind: 'paid', sessionId: 'cs_1', paymentIntentId: 'pi_1' });
    expect(
      mapStripeEvent({
        type: 'checkout.session.expired',
        data: { object: { id: 'cs_1' } },
      }).kind,
    ).toBe('expired');
    expect(
      mapStripeEvent({ type: 'charge.refunded', data: { object: {} } }).kind,
    ).toBe('refunded');
    expect(
      mapStripeEvent({ type: 'customer.created', data: { object: {} } }).kind,
    ).toBe('ignored');
  });
});

describe('createCheckout', () => {
  it('creates a pending order and attaches the session', async () => {
    const repos = createInMemoryRepositories(deps());
    const result = await createCheckout(
      { sku: 'standard', successUrl: 's', cancelUrl: 'c' },
      { provider: fakeProvider('cs_x'), repos },
    );
    expect(result.amountCents).toBe(1200);
    expect(result.sessionId).toBe('cs_x');
    const order = await repos.orders.findById(result.orderId);
    expect(order?.status).toBe('pending');
    expect(order?.stripeSessionId).toBe('cs_x');
  });

  it('refuses a non-purchasable SKU', async () => {
    const repos = createInMemoryRepositories(deps());
    await expect(
      createCheckout(
        { sku: 'free', successUrl: 's', cancelUrl: 'c' },
        { provider: fakeProvider(), repos },
      ),
    ).rejects.toThrow(NotPurchasableError);
  });
});

describe('handleStripeWebhook', () => {
  async function setup() {
    const repos = createInMemoryRepositories(deps());
    const checkout = await createCheckout(
      { sku: 'standard', successUrl: 's', cancelUrl: 'c', userId: 'u1' },
      { provider: fakeProvider('cs_paid'), repos },
    );
    return { repos, checkout };
  }

  it('fulfills the order and grants an entitlement on payment', async () => {
    const { repos, checkout } = await setup();
    const event = {
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_paid', payment_intent: 'pi_9' } },
    };
    const payload = JSON.stringify(event);
    const result = await handleStripeWebhook(payload, sign(payload), {
      repos,
      secret: SECRET,
      nowSec: 1000,
    });
    expect(result.status).toBe(200);
    expect(result.orderStatus).toBe('fulfilled');
    const order = await repos.orders.findById(checkout.orderId);
    expect(order?.status).toBe('fulfilled');
    expect(order?.stripePaymentIntentId).toBe('pi_9');
    const ents = await repos.entitlements.listByUser('u1');
    expect(ents).toHaveLength(1);
    expect(ents[0]?.sku).toBe('standard');
    expect(ents[0]?.source).toBe('purchase');
  });

  it('rejects a bad signature with 400', async () => {
    const { repos } = await setup();
    const payload = JSON.stringify({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_paid' } },
    });
    const result = await handleStripeWebhook(payload, `t=1000,v1=deadbeef`, {
      repos,
      secret: SECRET,
      nowSec: 1000,
    });
    expect(result.status).toBe(400);
    expect(result.handled).toBe(false);
  });

  it('acknowledges ignored events and unknown orders with 200', async () => {
    const { repos } = await setup();
    const ignored = JSON.stringify({
      type: 'customer.created',
      data: { object: {} },
    });
    expect(
      (
        await handleStripeWebhook(ignored, sign(ignored), {
          repos,
          secret: SECRET,
          nowSec: 1000,
        })
      ).reason,
    ).toBe('event ignored');

    const unknown = JSON.stringify({
      type: 'checkout.session.expired',
      data: { object: { id: 'cs_nope' } },
    });
    expect(
      (
        await handleStripeWebhook(unknown, sign(unknown), {
          repos,
          secret: SECRET,
          nowSec: 1000,
        })
      ).reason,
    ).toBe('no matching order');
  });

  it('expires a pending order and no-ops an illegal transition', async () => {
    const repos = createInMemoryRepositories(deps());
    await createCheckout(
      { sku: 'basic', successUrl: 's', cancelUrl: 'c' },
      { provider: fakeProvider('cs_exp'), repos },
    );
    const expire = JSON.stringify({
      type: 'checkout.session.expired',
      data: { object: { id: 'cs_exp' } },
    });
    const first = await handleStripeWebhook(expire, sign(expire), {
      repos,
      secret: SECRET,
      nowSec: 1000,
    });
    expect(first.orderStatus).toBe('expired');
    // A late "completed" for an expired order is a no-op (illegal transition).
    const complete = JSON.stringify({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_exp' } },
    });
    const second = await handleStripeWebhook(complete, sign(complete), {
      repos,
      secret: SECRET,
      nowSec: 1000,
    });
    expect(second.reason).toContain('no-op transition');
  });
});
