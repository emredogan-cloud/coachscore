import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LemonSqueezyPaymentProvider,
  LemonSqueezyVariantNotConfiguredError,
  variantForSku,
} from '@/lib/payments';
import type { CheckoutInput } from '@/lib/payments';

const baseInput: CheckoutInput = {
  productName: 'CoachScore Premium Report',
  unitAmountCents: 700,
  currency: 'usd',
  quantity: 1,
  successUrl: 'https://coachscore.app/report?status=success',
  cancelUrl: 'https://coachscore.app/pricing',
  clientReferenceId: 'order-123',
  customerEmail: 'p@example.com',
  sku: 'standard',
};

afterEach(() => {
  delete process.env.LEMONSQUEEZY_VARIANT_STANDARD;
  vi.restoreAllMocks();
});

function fakeFetch(status: number, json: unknown) {
  const calls: {
    url: string;
    body: string;
    headers: Record<string, string>;
  }[] = [];
  const impl = (
    url: string,
    init: { method: string; headers: Record<string, string>; body: string },
  ) => {
    calls.push({ url, body: init.body, headers: init.headers });
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(json),
    });
  };
  return { impl, calls };
}

describe('LemonSqueezyPaymentProvider', () => {
  it('creates a checkout for a SKU with a configured variant', async () => {
    process.env.LEMONSQUEEZY_VARIANT_STANDARD = '999';
    const { impl, calls } = fakeFetch(201, {
      data: { id: 'co_1', attributes: { url: 'https://pay.ls/co_1' } },
    });
    const p = new LemonSqueezyPaymentProvider('KEY', 'STORE', impl);
    const session = await p.createCheckoutSession(baseInput);

    expect(session).toEqual({ sessionId: 'co_1', url: 'https://pay.ls/co_1' });
    const body = JSON.parse(calls[0]!.body);
    expect(body.data.relationships.variant.data.id).toBe('999');
    expect(body.data.relationships.store.data.id).toBe('STORE');
    expect(body.data.attributes.checkout_data.custom.order_id).toBe(
      'order-123',
    );
    expect(calls[0]!.headers.Authorization).toBe('Bearer KEY');
  });

  it('throws a clear error when the SKU has no configured variant (documented blocker)', async () => {
    const { impl } = fakeFetch(201, {});
    const p = new LemonSqueezyPaymentProvider('KEY', 'STORE', impl);
    await expect(
      p.createCheckoutSession({ ...baseInput, sku: 'basic' }),
    ).rejects.toBeInstanceOf(LemonSqueezyVariantNotConfiguredError);
  });

  it('throws on a non-2xx LemonSqueezy response', async () => {
    process.env.LEMONSQUEEZY_VARIANT_STANDARD = '999';
    const { impl } = fakeFetch(422, { errors: [{ detail: 'bad' }] });
    const p = new LemonSqueezyPaymentProvider('KEY', 'STORE', impl);
    await expect(p.createCheckoutSession(baseInput)).rejects.toThrow(/422/);
  });

  it('variantForSku reads LEMONSQUEEZY_VARIANT_<SKU>', () => {
    process.env.LEMONSQUEEZY_VARIANT_STANDARD = '42';
    expect(variantForSku('standard')).toBe('42');
    expect(variantForSku('basic')).toBeNull();
    expect(variantForSku(undefined)).toBeNull();
  });
});
