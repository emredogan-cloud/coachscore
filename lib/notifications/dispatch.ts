/**
 * Notification delivery (Phase 5). Sends a queued notification as an email via
 * the injected provider and records the outcome on the notification row.
 * Feature-gated: without a Resend credential the provider throws and the
 * notification is marked `failed` (it still lives in-app). Unit-tested with a
 * fake provider + in-memory repos.
 */

import type { Notification, Repositories } from '@/lib/db';
import type { EmailProvider } from '@/lib/email';
import { notificationToEmail } from './templates';

export interface DispatchDeps {
  readonly provider: EmailProvider;
  readonly repos: Repositories;
}

export interface DispatchResult {
  readonly notificationId: string;
  readonly status: 'sent' | 'failed';
}

export async function dispatchNotification(
  notification: Notification,
  toEmail: string,
  deps: DispatchDeps,
): Promise<DispatchResult> {
  try {
    await deps.provider.send(notificationToEmail(notification, toEmail));
    await deps.repos.notifications.update(notification.id, { status: 'sent' });
    return { notificationId: notification.id, status: 'sent' };
  } catch {
    await deps.repos.notifications.update(notification.id, {
      status: 'failed',
    });
    return { notificationId: notification.id, status: 'failed' };
  }
}
