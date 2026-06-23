/**
 * Email delivery pipeline (Phase 4). Records the delivery, sends via the
 * injected provider, and updates the record's status — so every attempt is
 * auditable. Unit-tested with a fake provider + in-memory repos.
 */

import type { EmailDelivery, Repositories } from '@/lib/db';
import type { EmailMessage, EmailProvider } from './types';

export interface DeliveryDeps {
  readonly provider: EmailProvider;
  readonly repos: Repositories;
}

export interface DeliverInput {
  readonly template: EmailDelivery['template'];
  readonly message: EmailMessage;
  readonly relatedReportId?: string | null;
}

export interface DeliverResult {
  readonly deliveryId: string;
  readonly status: 'sent' | 'failed';
  readonly providerId?: string;
}

export async function deliverEmail(
  input: DeliverInput,
  deps: DeliveryDeps,
): Promise<DeliverResult> {
  const record = await deps.repos.emailDeliveries.create({
    toEmail: input.message.to,
    template: input.template,
    status: 'queued',
    relatedReportId: input.relatedReportId ?? null,
  });

  try {
    const result = await deps.provider.send(input.message);
    await deps.repos.emailDeliveries.update(record.id, {
      status: 'sent',
      providerId: result.id,
    });
    return { deliveryId: record.id, status: 'sent', providerId: result.id };
  } catch (err) {
    await deps.repos.emailDeliveries.update(record.id, {
      status: 'failed',
      error: err instanceof Error ? err.message : 'send failed',
    });
    return { deliveryId: record.id, status: 'failed' };
  }
}
