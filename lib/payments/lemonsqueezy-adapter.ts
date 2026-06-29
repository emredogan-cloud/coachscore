/**
 * LemonSqueezy payment provider (MON-P0) — the decided buyer-billing provider
 * (Merchant-of-Record; PAYMENTS_DECISION_RECORD.md), now implemented behind the
 * `PaymentProvider` interface. Real `fetch` call to the LemonSqueezy Checkouts
 * API (no SDK). LemonSqueezy prices by pre-configured VARIANT, so the SKU is
 * resolved to a variant id from `LEMONSQUEEZY_VARIANT_<SKU>` env.
 *
 * BLOCKER (documented, not fabricated): variants exist in env for STANDARD +
 * the products, but NOT for the simplified public SKUs (Premium Report=`basic`,
 * `account_rescue`). Those need to be created in LemonSqueezy and their ids set
 * before live checkout works for them — `createCheckoutSession` throws a clear
 * `LemonSqueezyVariantNotConfiguredError` until then. Everything else is built
 * and unit-tested. fetch is injectable so it tests with no network.
 */

import type { CheckoutInput, CheckoutSession, PaymentProvider } from './types';

const LS_CHECKOUTS_URL = 'https://api.lemonsqueezy.com/v1/checkouts';

export class LemonSqueezyNotConfiguredError extends Error {
  constructor() {
    super(
      'LemonSqueezy is not activated: set LEMONSQUEEZY_API_KEY + ' +
        'LEMONSQUEEZY_STORE_ID (+ per-SKU LEMONSQUEEZY_VARIANT_<SKU>).',
    );
    this.name = 'LemonSqueezyNotConfiguredError';
  }
}

export class LemonSqueezyVariantNotConfiguredError extends Error {
  constructor(sku: string) {
    super(
      `No LemonSqueezy variant configured for SKU "${sku}": create the variant ` +
        `and set LEMONSQUEEZY_VARIANT_${sku.toUpperCase()}.`,
    );
    this.name = 'LemonSqueezyVariantNotConfiguredError';
  }
}

function envValue(name: string): string | null {
  const v = process.env[name];
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

export function isLemonSqueezyConfigured(): boolean {
  return (
    envValue('LEMONSQUEEZY_API_KEY') !== null &&
    envValue('LEMONSQUEEZY_STORE_ID') !== null
  );
}

/** Resolve a SKU to its pre-configured LemonSqueezy variant id, or null. */
export function variantForSku(sku: string | undefined): string | null {
  if (!sku) return null;
  return envValue(`LEMONSQUEEZY_VARIANT_${sku.toUpperCase()}`);
}

type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export class LemonSqueezyPaymentProvider implements PaymentProvider {
  constructor(
    private readonly apiKey: string,
    private readonly storeId: string,
    private readonly fetchImpl: FetchLike = globalThis.fetch as unknown as FetchLike,
  ) {}

  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession> {
    const variantId = variantForSku(input.sku);
    if (variantId === null) {
      throw new LemonSqueezyVariantNotConfiguredError(input.sku ?? 'unknown');
    }
    const body = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: input.customerEmail,
            custom: input.clientReferenceId
              ? { order_id: input.clientReferenceId }
              : undefined,
          },
          product_options: { redirect_url: input.successUrl },
        },
        relationships: {
          store: { data: { type: 'stores', id: this.storeId } },
          variant: { data: { type: 'variants', id: variantId } },
        },
      },
    };
    const res = await this.fetchImpl(LS_CHECKOUTS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`LemonSqueezy checkout failed (${res.status}).`);
    }
    const json = (await res.json()) as {
      data?: { id?: string; attributes?: { url?: string } };
    };
    const url = json.data?.attributes?.url;
    const id = json.data?.id;
    if (!url || !id) {
      throw new Error('LemonSqueezy returned no checkout URL.');
    }
    return { sessionId: id, url };
  }
}

export function createLemonSqueezyProvider(): PaymentProvider {
  const apiKey = envValue('LEMONSQUEEZY_API_KEY');
  const storeId = envValue('LEMONSQUEEZY_STORE_ID');
  if (apiKey === null || storeId === null) {
    throw new LemonSqueezyNotConfiguredError();
  }
  return new LemonSqueezyPaymentProvider(apiKey, storeId);
}
