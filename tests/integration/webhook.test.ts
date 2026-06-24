import { describe, expect, it } from 'vitest';
import { computeSignature } from '@/lib/payments';

/**
 * Staging webhook integration (Phase 9) — LIVE. Posts a signed
 * `checkout.session.completed` to a deployed `/api/stripe/webhook` and asserts
 * it is accepted. Gated on `E2E_BASE_URL` + `STRIPE_WEBHOOK_SECRET` (staging
 * test mode); self-skips otherwise. The signature/handler logic is unit-tested
 * in `tests/payments`; this proves the deployed route end-to-end.
 */
const BASE = process.env.E2E_BASE_URL;
const SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const RUN = Boolean(BASE && SECRET);

describe.skipIf(!RUN)('stripe webhook (live staging)', () => {
  it('accepts a correctly-signed event', async () => {
    const payload = JSON.stringify({
      id: 'evt_test',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test', client_reference_id: 'order_test' } },
    });
    const t = String(Math.floor(Date.now() / 1000));
    const signature = `t=${t},v1=${computeSignature(payload, t, SECRET!)}`;
    const res = await fetch(`${BASE}/api/stripe/webhook`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': signature,
      },
      body: payload,
    });
    expect([200, 202]).toContain(res.status);
  });
});
