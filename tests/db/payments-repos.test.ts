import { describe, expect, it } from 'vitest';
import { createInMemoryRepositories } from '@/lib/db';
import type { RepoDeps } from '@/lib/db';

function deps(): RepoDeps {
  let n = 0;
  return {
    idGen: () => `id-${++n}`,
    now: () => new Date('2026-06-24T00:00:00.000Z'),
  };
}

describe('orders repository', () => {
  it('creates with defaults, finds by session, updates, lists by user', async () => {
    const { orders } = createInMemoryRepositories(deps());
    const order = await orders.create({
      userId: 'u1',
      tier: 'standard',
      amountCents: 1200,
    });
    expect(order.status).toBe('pending');
    expect(order.quantity).toBe(1);
    expect(order.currency).toBe('usd');

    await orders.update(order.id, { stripeSessionId: 'cs_1', status: 'paid' });
    expect((await orders.findByStripeSessionId('cs_1'))?.status).toBe('paid');
    expect(await orders.findByStripeSessionId('missing')).toBeNull();
    expect(await orders.findById(order.id)).not.toBeNull();
    expect(await orders.listByUser('u1')).toHaveLength(1);
    expect(await orders.update('nope', { status: 'failed' })).toBeNull();
  });
});

describe('entitlements repository', () => {
  it('creates and queries by user and report', async () => {
    const { entitlements } = createInMemoryRepositories(deps());
    await entitlements.create({
      userId: 'u1',
      sku: 'standard',
      reportId: 'r1',
      source: 'purchase',
    });
    expect(await entitlements.listByUser('u1')).toHaveLength(1);
    expect(await entitlements.findForReport('u1', 'r1')).not.toBeNull();
    expect(await entitlements.findForReport('u1', 'other')).toBeNull();
    expect(await entitlements.findForReport('u2', 'r1')).toBeNull();
  });
});

describe('email deliveries repository', () => {
  it('creates (queued), updates status, finds by id', async () => {
    const { emailDeliveries } = createInMemoryRepositories(deps());
    const rec = await emailDeliveries.create({
      toEmail: 'a@b.co',
      template: 'receipt',
    });
    expect(rec.status).toBe('queued');
    const sent = await emailDeliveries.update(rec.id, {
      status: 'sent',
      providerId: 'em_1',
    });
    expect(sent?.status).toBe('sent');
    expect(await emailDeliveries.findById(rec.id)).not.toBeNull();
    expect(
      await emailDeliveries.update('nope', { status: 'failed' }),
    ).toBeNull();
  });
});
