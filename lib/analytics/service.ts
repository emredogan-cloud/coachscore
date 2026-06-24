/**
 * Analytics service (Phase 7). Validates an event against the taxonomy, strips
 * PII, and dispatches it to the forward sink (PostHog/no-op) and, when a repo is
 * provided, persists it locally so the growth dashboard works without PostHog.
 * Depends only on interfaces, so it is unit-tested with a memory sink + in-memory
 * repo — no key, no network, no database.
 */

import type { AnalyticsEventRepository } from '@/lib/db';
import { isAnalyticsEventName, stripPii } from './taxonomy';
import type { AnalyticsEvent, AnalyticsProvider, CapturedEvent } from './types';

export class AnalyticsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalyticsError';
  }
}

export interface AnalyticsServiceDeps {
  /** Forward sink (PostHog or no-op). */
  readonly provider: AnalyticsProvider;
  /** Optional local persistence sink (DB-gated; powers the growth dashboard). */
  readonly repo?: AnalyticsEventRepository;
}

export class AnalyticsService {
  constructor(private readonly deps: AnalyticsServiceDeps) {}

  /** Validate, scrub PII, capture to the sink(s). Throws on an unknown event. */
  async track(event: AnalyticsEvent): Promise<CapturedEvent> {
    if (!isAnalyticsEventName(event.name)) {
      throw new AnalyticsError(`Unknown analytics event "${event.name}".`);
    }
    const { clean } = stripPii(event.properties ?? {});
    const userId = event.context?.userId ?? null;
    const anonId = event.context?.anonId ?? null;
    const captured: CapturedEvent = {
      name: event.name,
      distinctId: userId ?? anonId ?? 'anonymous',
      properties: clean,
      source: event.context?.source ?? 'server',
      userId,
      anonId,
    };

    await this.deps.provider.capture(captured);
    if (this.deps.repo) {
      await this.deps.repo.create({
        userId,
        anonId,
        name: captured.name,
        source: captured.source,
        properties: clean,
      });
    }
    return captured;
  }
}
