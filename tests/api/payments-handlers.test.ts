import { describe, expect, it } from 'vitest';
import { handleCheckout, handleStripeWebhookRequest } from '@/lib/api';
import { createInMemoryRepositories } from '@/lib/db';
import type { RepoDeps } from '@/lib/db';
import type { PaymentProvider } from '@/lib/payments';

function deps(): RepoDeps {
  let n = 0;
  return {
    idGen: () => `id-${++n}`,
    now: () => new Date('2026-06-24T00:00:00.000Z'),
  };
}
const fakeProvider: PaymentProvider = {
  async createCheckoutSession() {
    return { sessionId: 'cs_1', url: 'https://stripe.test/cs_1' };
  },
};

describe('handleCheckout', () => {
  it('rejects an invalid body and a non-purchasable SKU', async () => {
    expect((await handleCheckout({ sku: 'nope' })).status).toBe(422);
    expect((await handleCheckout({ sku: 'free' })).status).toBe(422);
  });

  it('returns 503 when payments are not activated', async () => {
    const res = await handleCheckout(
      { sku: 'standard' },
      { isActivated: () => false },
    );
    expect(res.status).toBe(503);
  });

  it('creates a checkout session when activated', async () => {
    const res = await handleCheckout(
      { sku: 'standard' },
      {
        isActivated: () => true,
        provider: fakeProvider,
        repos: createInMemoryRepositories(deps()),
        appUrl: 'https://app.test',
      },
    );
    expect(res.status).toBe(200);
    const b = res.body as { url: string; amountCents: number };
    expect(b.url).toBe('https://stripe.test/cs_1');
    expect(b.amountCents).toBe(1200);
  });
});

describe('handleStripeWebhookRequest', () => {
  it('returns 503 when not activated', async () => {
    const res = await handleStripeWebhookRequest('{}', 't=1,v1=x', {
      isActivated: () => false,
    });
    expect(res.status).toBe(503);
  });

  it('rejects a missing signature with 422', async () => {
    const res = await handleStripeWebhookRequest('{}', null, {
      isActivated: () => true,
      handle: async () => ({ handled: true, status: 200 }),
    });
    expect(res.status).toBe(422);
  });

  it('passes through to the webhook handler when activated', async () => {
    const res = await handleStripeWebhookRequest('{}', 't=1,v1=x', {
      isActivated: () => true,
      handle: async () => ({
        handled: true,
        status: 200,
        orderStatus: 'fulfilled',
      }),
    });
    expect(res.status).toBe(200);
    const b = res.body as { received: boolean; orderStatus: string | null };
    expect(b.received).toBe(true);
    expect(b.orderStatus).toBe('fulfilled');
  });
});
