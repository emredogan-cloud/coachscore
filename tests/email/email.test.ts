import { describe, expect, it } from 'vitest';
import { createInMemoryRepositories } from '@/lib/db';
import type { RepoDeps } from '@/lib/db';
import {
  deliverEmail,
  receiptEmail,
  reportReadyEmail,
  type EmailProvider,
} from '@/lib/email';

function deps(): RepoDeps {
  let n = 0;
  return {
    idGen: () => `id-${++n}`,
    now: () => new Date('2026-06-24T00:00:00.000Z'),
  };
}

describe('email templates', () => {
  it('report-ready includes grade, link, and disclaimer', () => {
    const msg = reportReadyEmail({
      toEmail: 'a@b.co',
      grade: 'A',
      overall: 85,
      townHall: 14,
      reportUrl: 'https://coachscore.app/r/1',
    });
    expect(msg.to).toBe('a@b.co');
    expect(msg.subject).toContain('Grade A');
    expect(msg.html).toContain('href="https://coachscore.app/r/1"');
    expect(msg.text).toContain('85');
    expect(msg.html).toContain('not endorsed by Supercell');
  });

  it('receipt formats the amount and names the tier', () => {
    const msg = receiptEmail({
      toEmail: 'a@b.co',
      sku: 'standard',
      amountCents: 1200,
      currency: 'usd',
      orderId: 'o-1',
    });
    expect(msg.subject).toContain('Standard');
    expect(msg.html).toContain('$12.00 USD');
    expect(msg.text).toContain('o-1');
  });

  it('HTML-escapes interpolated values', () => {
    const msg = reportReadyEmail({
      toEmail: 'a@b.co',
      grade: 'A',
      overall: 1,
      townHall: 14,
      reportUrl: 'https://x/?a=1&b="2"',
    });
    expect(msg.html).toContain('&amp;');
    expect(msg.html).not.toContain('&b="2"');
  });
});

describe('deliverEmail', () => {
  const message = reportReadyEmail({
    toEmail: 'a@b.co',
    grade: 'A',
    overall: 85,
    townHall: 14,
    reportUrl: 'https://x/r',
  });

  it('records a sent delivery on success', async () => {
    const repos = createInMemoryRepositories(deps());
    const provider: EmailProvider = {
      async send() {
        return { id: 'em_1' };
      },
    };
    const result = await deliverEmail(
      { template: 'report_ready', message },
      { provider, repos },
    );
    expect(result.status).toBe('sent');
    expect(result.providerId).toBe('em_1');
    const record = await repos.emailDeliveries.findById(result.deliveryId);
    expect(record?.status).toBe('sent');
    expect(record?.providerId).toBe('em_1');
  });

  it('records a failed delivery when the provider throws', async () => {
    const repos = createInMemoryRepositories(deps());
    const provider: EmailProvider = {
      async send() {
        throw new Error('boom');
      },
    };
    const result = await deliverEmail(
      { template: 'report_ready', message },
      { provider, repos },
    );
    expect(result.status).toBe('failed');
    const record = await repos.emailDeliveries.findById(result.deliveryId);
    expect(record?.status).toBe('failed');
    expect(record?.error).toBe('boom');
  });
});
