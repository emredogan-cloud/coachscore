/**
 * Reminder delivery channels (Feature 3). An abstraction over how a reminder
 * reaches the user: `local` Web Notifications today, with `web_push` and `email`
 * as documented future channels (cron-driven). Everything is guarded so it's safe
 * to import on the server (channel availability is checked at call time).
 */

export type ChannelKind = 'local' | 'web_push' | 'email';

export interface DeliverableReminder {
  readonly title: string;
  readonly body: string;
  readonly url?: string;
}

export interface ReminderChannel {
  readonly kind: ChannelKind;
  /** Whether this channel can deliver right now (env + permission). */
  available(): boolean;
  /** Deliver the reminder; resolves true on success. */
  deliver(reminder: DeliverableReminder): Promise<boolean>;
}

/** Local Web Notifications — the only live channel today (browser, opt-in). */
export const localNotificationChannel: ReminderChannel = {
  kind: 'local',
  available() {
    return (
      typeof window !== 'undefined' &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    );
  },
  async deliver(reminder) {
    if (!this.available()) return false;
    try {
      new Notification(reminder.title, { body: reminder.body });
      return true;
    } catch {
      return false;
    }
  },
};

/** Future channels — architecture in place; activated with infra (push/cron, Resend). */
export const webPushChannel: ReminderChannel = {
  kind: 'web_push',
  available: () => false,
  deliver: async () => false,
};
export const emailChannel: ReminderChannel = {
  kind: 'email',
  available: () => false,
  deliver: async () => false,
};

export const REMINDER_CHANNELS: readonly ReminderChannel[] = [
  localNotificationChannel,
  webPushChannel,
  emailChannel,
];
