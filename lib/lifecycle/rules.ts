/**
 * Lifecycle rules (Phase 7). Pure, deterministic functions over a
 * `LifecycleState` + the clock — they decide which messages are due. The D1/D7/
 * D30 retention loops + abandoned-checkout reminder + winback from the roadmap's
 * growth strategy. Each message's `dedupeKey` is anchored to the source event,
 * so a given anchor schedules at most once.
 */

import type { LifecycleKind, LifecyclePlan, LifecycleState } from './types';

const HOUR = 3_600_000;
const DAY = 86_400_000;
const ABANDONED_CHECKOUT_HOURS = 1;
const RETENTION_DAYS = 7;
const WINBACK_DAYS = 30;

function hoursBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / HOUR;
}
function daysBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / DAY;
}
function subjectOf(state: LifecycleState): string | null {
  return state.userId ?? state.anonId ?? null;
}
function dedupe(
  kind: LifecycleKind,
  state: LifecycleState,
  anchor: Date,
): string {
  return `${kind}:${subjectOf(state) ?? 'unknown'}:${anchor.toISOString()}`;
}

export interface LifecycleRule {
  readonly kind: LifecycleKind;
  evaluate(state: LifecycleState, now: Date): LifecyclePlan | null;
}

function plan(
  kind: LifecycleKind,
  state: LifecycleState,
  anchor: Date,
  now: Date,
  title: string,
  body: string,
): LifecyclePlan {
  return {
    kind,
    dedupeKey: dedupe(kind, state, anchor),
    scheduledFor: now,
    subjectUserId: state.userId,
    anonId: state.anonId ?? null,
    title,
    body,
    payload:
      typeof state.townHall === 'number'
        ? { townHall: state.townHall }
        : undefined,
  };
}

/** D1 — saw the teaser but didn't buy: deliver the #1 move. */
export const onboardingRule: LifecycleRule = {
  kind: 'onboarding_reminder',
  evaluate(state, now) {
    if (!state.teaserCompletedAt || state.hasPurchased) return null;
    if (daysBetween(state.teaserCompletedAt, now) < 1) return null;
    return plan(
      'onboarding_reminder',
      state,
      state.teaserCompletedAt,
      now,
      'Your CoachScore roadmap is ready',
      "Here's your #1 move — unlock the full prioritized upgrade roadmap.",
    );
  },
};

/** Started checkout, never finished: a nudge an hour later. */
export const abandonedCheckoutRule: LifecycleRule = {
  kind: 'abandoned_checkout',
  evaluate(state, now) {
    if (!state.checkoutStartedAt || state.hasPurchased) return null;
    if (hoursBetween(state.checkoutStartedAt, now) < ABANDONED_CHECKOUT_HOURS) {
      return null;
    }
    return plan(
      'abandoned_checkout',
      state,
      state.checkoutStartedAt,
      now,
      'Finish unlocking your full report',
      'Your report is one step away — pick up where you left off.',
    );
  },
};

/** D7 — bought a report a week ago: nudge a re-score as the account climbs. */
export const retentionRule: LifecycleRule = {
  kind: 'retention',
  evaluate(state, now) {
    if (!state.hasPurchased || !state.lastPurchaseAt) return null;
    if (daysBetween(state.lastPurchaseAt, now) < RETENTION_DAYS) return null;
    return plan(
      'retention',
      state,
      state.lastPurchaseAt,
      now,
      'Upgraded since your last CoachScore?',
      'Re-score your account to watch your grade climb after recent upgrades.',
    );
  },
};

/** D30 — dormant after buying: a comeback nudge. */
export const winbackRule: LifecycleRule = {
  kind: 'winback',
  evaluate(state, now) {
    if (!state.hasPurchased || !state.lastActiveAt) return null;
    if (daysBetween(state.lastActiveAt, now) < WINBACK_DAYS) return null;
    return plan(
      'winback',
      state,
      state.lastActiveAt,
      now,
      'Your account has probably changed — get a fresh CoachScore',
      "It's been a while. A lot can shift in a month — see where your grade stands now.",
    );
  },
};

export const LIFECYCLE_RULES: readonly LifecycleRule[] = [
  onboardingRule,
  abandonedCheckoutRule,
  retentionRule,
  winbackRule,
];

/** Run every rule; return the messages that are due now. */
export function planLifecycle(
  state: LifecycleState,
  now: Date,
  rules: readonly LifecycleRule[] = LIFECYCLE_RULES,
): LifecyclePlan[] {
  const out: LifecyclePlan[] = [];
  for (const rule of rules) {
    const due = rule.evaluate(state, now);
    if (due !== null && (due.subjectUserId !== null || due.anonId !== null)) {
      out.push(due);
    }
  }
  return out;
}
