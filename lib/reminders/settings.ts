/**
 * Reminder settings (Feature 3). The user controls whether they get
 * "upgrade probably finished — re-check your score" reminders and how often.
 * Pure; the client persists these to localStorage and (future) the DB.
 */

export type NotificationFrequency = 'off' | 'weekly' | 'biweekly' | 'monthly';

export interface ReminderSettings {
  readonly enabled: boolean;
  readonly frequency: NotificationFrequency;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  frequency: 'weekly',
};

export const FREQUENCY_OPTIONS: readonly {
  value: NotificationFrequency;
  label: string;
}[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
];

/** Interval in days for a frequency; `Infinity` when off. */
export function frequencyDays(frequency: NotificationFrequency): number {
  switch (frequency) {
    case 'weekly':
      return 7;
    case 'biweekly':
      return 14;
    case 'monthly':
      return 30;
    case 'off':
      return Infinity;
  }
}

export function normalizeSettings(
  input: Partial<ReminderSettings>,
): ReminderSettings {
  const frequency: NotificationFrequency =
    input.frequency === 'weekly' ||
    input.frequency === 'biweekly' ||
    input.frequency === 'monthly' ||
    input.frequency === 'off'
      ? input.frequency
      : DEFAULT_REMINDER_SETTINGS.frequency;
  return { enabled: input.enabled === true, frequency };
}
