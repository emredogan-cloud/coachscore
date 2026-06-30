'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_REMINDER_SETTINGS,
  FREQUENCY_OPTIONS,
  normalizeSettings,
  type NotificationFrequency,
  type ReminderSettings,
} from '@/lib/reminders';

/**
 * Notification settings (Feature 3). The user opts into "your upgrade probably
 * finished — re-check your score" reminders and picks a frequency. Persists to
 * localStorage; enabling requests Web Notification permission. The actual
 * scheduling logic is pure + tested in lib/reminders.
 */
const KEY = 'cs_reminders';

function load(): ReminderSettings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw
      ? normalizeSettings(JSON.parse(raw) as Partial<ReminderSettings>)
      : DEFAULT_REMINDER_SETTINGS;
  } catch {
    return DEFAULT_REMINDER_SETTINGS;
  }
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<ReminderSettings>(
    DEFAULT_REMINDER_SETTINGS,
  );
  const [permission, setPermission] = useState<string>('default');

  useEffect(() => {
    setSettings(load());
    if (typeof Notification !== 'undefined')
      setPermission(Notification.permission);
  }, []);

  function persist(next: ReminderSettings) {
    setSettings(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage blocked */
    }
  }

  async function toggleEnabled() {
    const next = { ...settings, enabled: !settings.enabled };
    if (next.enabled && typeof Notification !== 'undefined') {
      if (Notification.permission === 'default') {
        const p = await Notification.requestPermission();
        setPermission(p);
      } else {
        setPermission(Notification.permission);
      }
    }
    persist(next);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
        <div>
          <p className="font-semibold text-white">Re-score reminders</p>
          <p className="text-sm text-[var(--muted)]">
            We&apos;ll nudge you when an upgrade probably finished — come back
            and watch your grade climb.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.enabled}
          onClick={() => void toggleEnabled()}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${
            settings.enabled ? 'bg-violet-gradient' : 'bg-white/15'
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
              settings.enabled ? 'left-6' : 'left-1'
            }`}
          />
        </button>
      </div>

      {settings.enabled ? (
        <div>
          <p className="text-sm font-medium text-white">How often?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {FREQUENCY_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={settings.frequency === o.value}
                onClick={() =>
                  persist({
                    ...settings,
                    frequency: o.value as NotificationFrequency,
                  })
                }
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  settings.frequency === o.value
                    ? 'border-brand-violet bg-violet-gradient text-white'
                    : 'border-white/10 bg-white/5 text-[var(--fg)]/80 hover:border-brand-violet/40'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          {permission === 'denied' ? (
            <p className="mt-3 text-xs text-amber-300/90">
              Browser notifications are blocked — we&apos;ll still show your due
              re-checks in-app. Enable notifications in your browser settings
              for push reminders.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
