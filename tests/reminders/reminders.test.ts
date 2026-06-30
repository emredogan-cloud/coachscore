import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REMINDER_SETTINGS,
  dueReminders,
  emailChannel,
  FREQUENCY_OPTIONS,
  frequencyDays,
  localNotificationChannel,
  nextReminder,
  normalizeSettings,
  REMINDER_CHANNELS,
  webPushChannel,
  type ReminderSettings,
  type ReminderState,
} from '@/lib/reminders';

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_000_000_000_000;

const state = (over: Partial<ReminderState>): ReminderState => ({
  lastScoredAtMs: NOW,
  townHall: 16,
  topUpgradeLabel: 'Archer Queen',
  settings: { enabled: true, frequency: 'weekly' },
  ...over,
});

describe('settings', () => {
  it.each([
    ['weekly', 7],
    ['biweekly', 14],
    ['monthly', 30],
    ['off', Infinity],
  ] as const)('frequencyDays(%s) = %s', (f, days) => {
    expect(frequencyDays(f)).toBe(days);
  });

  it('defaults are off + weekly', () => {
    expect(DEFAULT_REMINDER_SETTINGS).toEqual({
      enabled: false,
      frequency: 'weekly',
    });
  });

  it.each([
    [{}, false, 'weekly'],
    [{ enabled: true }, true, 'weekly'],
    [{ enabled: true, frequency: 'monthly' }, true, 'monthly'],
    [{ enabled: 'yes' as unknown as boolean }, false, 'weekly'],
    [{ frequency: 'nonsense' as never }, false, 'weekly'],
  ])('normalizeSettings(%o)', (input, enabled, frequency) => {
    const s = normalizeSettings(input as Partial<ReminderSettings>);
    expect(s.enabled).toBe(enabled);
    expect(s.frequency).toBe(frequency);
  });
});

describe('nextReminder', () => {
  it('is never due when disabled', () => {
    expect(
      nextReminder(
        state({ settings: { enabled: false, frequency: 'weekly' } }),
        NOW + 100 * DAY,
      ).due,
    ).toBe(false);
  });
  it('is never due when frequency is off', () => {
    expect(
      nextReminder(
        state({ settings: { enabled: true, frequency: 'off' } }),
        NOW + 100 * DAY,
      ).due,
    ).toBe(false);
  });

  it.each([
    ['weekly', 6, false],
    ['weekly', 7, true],
    ['weekly', 9, true],
    ['biweekly', 13, false],
    ['biweekly', 14, true],
    ['monthly', 29, false],
    ['monthly', 30, true],
    ['monthly', 60, true],
  ] as const)('%s after %d days → due=%s', (frequency, days, due) => {
    const r = nextReminder(
      state({ settings: { enabled: true, frequency } }),
      NOW + days * DAY,
    );
    expect(r.due).toBe(due);
  });

  it('references the upgrade in the message', () => {
    const r = nextReminder(
      state({ topUpgradeLabel: 'Grand Warden' }),
      NOW + 8 * DAY,
    );
    expect(r.message).toContain('Grand Warden');
  });

  it.each([
    ['weekly', 7],
    ['biweekly', 14],
    ['monthly', 30],
  ] as const)('dueAt for %s is lastScored + %d days', (frequency, days) => {
    const r = nextReminder(
      state({ settings: { enabled: true, frequency } }),
      NOW,
    );
    expect(r.dueAtMs).toBe(NOW + days * DAY);
  });
});

describe('frequency options + channel registry', () => {
  it('exposes the three user-facing cadences (off is the disable toggle, not an option)', () => {
    expect(FREQUENCY_OPTIONS.map((o) => o.value)).toEqual([
      'weekly',
      'biweekly',
      'monthly',
    ]);
    for (const o of FREQUENCY_OPTIONS)
      expect(o.label.length).toBeGreaterThan(0);
  });

  it('REMINDER_CHANNELS lists the three channels with unique kinds', () => {
    const kinds = REMINDER_CHANNELS.map((c) => c.kind);
    expect(kinds).toEqual(['local', 'web_push', 'email']);
    expect(new Set(kinds).size).toBe(3);
  });

  it('every channel exposes available() + deliver()', () => {
    for (const c of REMINDER_CHANNELS) {
      expect(typeof c.available).toBe('function');
      expect(typeof c.deliver).toBe('function');
    }
  });
});

describe('dueReminders', () => {
  it('returns only the accounts whose reminder is due', () => {
    const states = [
      state({ lastScoredAtMs: NOW - 10 * DAY }), // due
      state({ lastScoredAtMs: NOW - 2 * DAY }), // not due (weekly)
      state({ settings: { enabled: false, frequency: 'weekly' } }), // disabled
    ];
    const due = dueReminders(states, NOW);
    expect(due).toHaveLength(1);
    expect(due[0]?.message).toBeTruthy();
  });

  it('returns nothing for an empty set', () => {
    expect(dueReminders([], NOW)).toEqual([]);
  });
});

describe('channels', () => {
  it('local channel is unavailable on the server (no Notification/permission)', () => {
    expect(localNotificationChannel.available()).toBe(false);
  });
  it.each([webPushChannel, emailChannel])(
    'future channel %s is not yet available',
    async (ch) => {
      expect(ch.available()).toBe(false);
      expect(await ch.deliver({ title: 't', body: 'b' })).toBe(false);
    },
  );
  it('local deliver no-ops when unavailable', async () => {
    expect(
      await localNotificationChannel.deliver({ title: 't', body: 'b' }),
    ).toBe(false);
  });
});
