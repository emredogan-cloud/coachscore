/**
 * Retention foundations — re-score reminders (PMF-correction sprint · Phase 7).
 *
 * The product is episodic ("what do I upgrade next?"), so the single biggest
 * retention lever is bringing a player back to RE-SCORE after an upgrade likely
 * finished and watch their grade climb. This module builds the *foundations*
 * only: pure functions that compute when to nudge and what to say, plus a
 * `RetentionReminder` data model a future scheduler (web-push / email) can
 * persist and send. Nothing is sent here — no channels are wired.
 *
 * Pure: timing is computed from an injected `nowMs` so it's deterministic and
 * testable. Upgrade durations aren't modeled yet (a future data task), so the
 * cadence is a documented heuristic, not a claim about a specific build time.
 */

export type NudgeReason = 'top_upgrade' | 'periodic';

export interface ReScoreNudge {
  readonly dueInDays: number;
  readonly dueAtIso: string | null;
  readonly message: string;
  readonly reason: NudgeReason;
}

export interface RetentionReminder {
  readonly subjectId: string;
  readonly snapshotHash: string;
  readonly townHall: number;
  readonly grade: string;
  readonly dueAtIso: string;
  readonly channel: 'web_push' | 'email' | 'none';
  /** Foundations only: reminders are scheduled, never marked sent here. */
  readonly status: 'scheduled';
  readonly reason: NudgeReason;
  readonly message: string;
}

/**
 * Heuristic cadence: higher Town Halls have longer upgrades, so nudge later.
 * Deliberately coarse — replace with real per-element upgrade durations later.
 */
function nudgeDaysForTownHall(townHall: number): number {
  if (townHall >= 16) return 10;
  if (townHall >= 13) return 7;
  return 5;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export interface NudgeInput {
  readonly townHall: number;
  /** A friendly label for the top upgrade (e.g. "Archer Queen"), if known. */
  readonly topUpgradeLabel?: string | null;
  /** Current time in ms; when omitted, `dueAtIso` is null (timing deferred). */
  readonly nowMs?: number;
}

/** Compute the next re-score nudge (when + message). Pure. */
export function nextReScoreNudge(input: NudgeInput): ReScoreNudge {
  const dueInDays = nudgeDaysForTownHall(input.townHall);
  const label = input.topUpgradeLabel?.trim();
  const reason: NudgeReason = label ? 'top_upgrade' : 'periodic';
  const message = label
    ? `Your ${label} upgrade has probably finished — come back and see your new CoachScore.`
    : `It's been about ${dueInDays} days — re-check your account and watch your grade climb.`;
  const dueAtIso =
    input.nowMs === undefined
      ? null
      : new Date(input.nowMs + dueInDays * DAY_MS).toISOString();
  return { dueInDays, dueAtIso, message, reason };
}

export interface ReminderInput extends NudgeInput {
  readonly subjectId: string;
  readonly snapshotHash: string;
  readonly grade: string;
  readonly channel?: RetentionReminder['channel'];
  /** Required to produce a concrete due date for a persisted reminder. */
  readonly nowMs: number;
}

/**
 * Build a (not-yet-sent) retention reminder a scheduler can persist. The channel
 * defaults to `none` until web-push/email is wired — foundations only.
 */
export function buildReminder(input: ReminderInput): RetentionReminder {
  const nudge = nextReScoreNudge(input);
  return {
    subjectId: input.subjectId,
    snapshotHash: input.snapshotHash,
    townHall: input.townHall,
    grade: input.grade,
    dueAtIso: nudge.dueAtIso ?? new Date(input.nowMs).toISOString(),
    channel: input.channel ?? 'none',
    status: 'scheduled',
    reason: nudge.reason,
    message: nudge.message,
  };
}
