/**
 * Lifecycle messaging (Phase 7). A deterministic rules engine turns a user's
 * lifecycle state + the clock into due messages (onboarding, abandoned checkout,
 * retention, winback); the service persists them (deduped) and dispatches them
 * through a delivery boundary that is feature-gated on email. Pure types here.
 */

import type { LifecycleMessageRow } from '@/lib/db';

export type LifecycleKind =
  | 'onboarding_reminder'
  | 'abandoned_checkout'
  | 'retention'
  | 'winback';

/** A snapshot of where a user sits in the lifecycle (derived from events/orders). */
export interface LifecycleState {
  readonly userId: string | null;
  readonly anonId?: string | null;
  readonly townHall?: number | null;
  readonly teaserCompletedAt?: Date | null;
  readonly checkoutStartedAt?: Date | null;
  readonly lastPurchaseAt?: Date | null;
  readonly lastActiveAt?: Date | null;
  readonly hasPurchased?: boolean;
}

/** A message the rules engine decided is due. */
export interface LifecyclePlan {
  readonly kind: LifecycleKind;
  readonly dedupeKey: string;
  readonly scheduledFor: Date;
  readonly subjectUserId: string | null;
  readonly anonId: string | null;
  readonly title: string;
  readonly body: string;
  readonly payload?: Record<string, unknown>;
}

/** Delivery boundary — implemented over email/notifications at activation. */
export interface LifecycleDeliverer {
  deliver(
    message: LifecycleMessageRow,
  ): Promise<{ delivered: boolean; reason?: string }>;
}
