/**
 * Lifecycle service (Phase 7). Schedules due messages (deduped) from the rules
 * engine and dispatches scheduled messages whose time has come through an
 * injected delivery boundary. Delivery is feature-gated: when no deliverer is
 * provided (email not activated) `dispatchDue` is a no-op and messages stay
 * scheduled, to be sent the moment delivery is wired — never faked. Depends only
 * on the `Repositories` interface, so it is unit-tested with in-memory repos.
 */

import type { LifecycleMessageRow, Repositories } from '@/lib/db';
import { planLifecycle, type LifecycleRule } from './rules';
import type { LifecycleDeliverer, LifecycleState } from './types';

export interface LifecycleServiceDeps {
  readonly repos: Repositories;
  /** Delivery boundary; absent ⇒ delivery not activated, dispatch is a no-op. */
  readonly deliverer?: LifecycleDeliverer;
  readonly now?: () => Date;
  readonly rules?: readonly LifecycleRule[];
}

export interface DispatchResult {
  readonly sent: number;
  readonly failed: number;
  /** Due messages left scheduled because delivery is not activated. */
  readonly pending: number;
}

export class LifecycleService {
  private readonly repos: Repositories;
  private readonly deliverer?: LifecycleDeliverer;
  private readonly now: () => Date;
  private readonly rules?: readonly LifecycleRule[];
  constructor(deps: LifecycleServiceDeps) {
    this.repos = deps.repos;
    this.deliverer = deps.deliverer;
    this.now = deps.now ?? (() => new Date());
    this.rules = deps.rules;
  }

  /** Evaluate the rules for a user and persist any newly-due messages (deduped). */
  async plan(state: LifecycleState): Promise<LifecycleMessageRow[]> {
    const now = this.now();
    const plans = planLifecycle(state, now, this.rules);
    const created: LifecycleMessageRow[] = [];
    for (const p of plans) {
      const existing = await this.repos.lifecycleMessages.findByDedupeKey(
        p.dedupeKey,
      );
      if (existing) continue;
      const row = await this.repos.lifecycleMessages.create({
        userId: p.subjectUserId,
        anonId: p.anonId,
        kind: p.kind,
        status: 'scheduled',
        dedupeKey: p.dedupeKey,
        scheduledFor: p.scheduledFor,
        payload: { title: p.title, body: p.body, ...(p.payload ?? {}) },
      });
      created.push(row);
    }
    return created;
  }

  /** Deliver scheduled messages whose time has come (gated on the deliverer). */
  async dispatchDue(): Promise<DispatchResult> {
    const now = this.now();
    const scheduled =
      await this.repos.lifecycleMessages.listByStatus('scheduled');
    const due = scheduled.filter(
      (m) => m.scheduledFor.getTime() <= now.getTime(),
    );

    if (!this.deliverer) {
      return { sent: 0, failed: 0, pending: due.length };
    }

    let sent = 0;
    let failed = 0;
    for (const message of due) {
      const result = await this.deliverer.deliver(message);
      if (result.delivered) {
        await this.repos.lifecycleMessages.update(message.id, {
          status: 'sent',
          sentAt: now,
        });
        sent += 1;
      } else {
        await this.repos.lifecycleMessages.update(message.id, {
          status: 'failed',
        });
        failed += 1;
      }
    }
    return { sent, failed, pending: 0 };
  }
}
