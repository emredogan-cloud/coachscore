/**
 * Reminder scheduling (Feature 3 — the retention loop). Pure: given when a player
 * last scored, their Town Hall, the upgrade they were told to do, and their
 * settings, decide when the next "your upgrade probably finished — re-check your
 * CoachScore" reminder is due, and what it says. Reuses the retention nudge copy.
 */

import { nextReScoreNudge } from '@/lib/retention';
import { frequencyDays, type ReminderSettings } from './settings';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ReminderState {
  readonly lastScoredAtMs: number;
  readonly townHall: number;
  readonly topUpgradeLabel?: string | null;
  readonly settings: ReminderSettings;
}

export interface DueReminder {
  readonly due: boolean;
  readonly dueAtMs: number | null;
  readonly message: string | null;
}

/** Compute the next reminder for a player. Pure. */
export function nextReminder(state: ReminderState, nowMs: number): DueReminder {
  if (!state.settings.enabled || state.settings.frequency === 'off') {
    return { due: false, dueAtMs: null, message: null };
  }
  const intervalMs = frequencyDays(state.settings.frequency) * DAY_MS;
  const dueAtMs = state.lastScoredAtMs + intervalMs;
  const nudge = nextReScoreNudge({
    townHall: state.townHall,
    topUpgradeLabel: state.topUpgradeLabel,
    nowMs: state.lastScoredAtMs,
  });
  return { due: nowMs >= dueAtMs, dueAtMs, message: nudge.message };
}

/** From many tracked accounts, the ones whose reminder is due now. Pure. */
export function dueReminders(
  states: readonly ReminderState[],
  nowMs: number,
): readonly (ReminderState & { message: string })[] {
  const out: (ReminderState & { message: string })[] = [];
  for (const s of states) {
    const r = nextReminder(s, nowMs);
    if (r.due && r.message) out.push({ ...s, message: r.message });
  }
  return out;
}
