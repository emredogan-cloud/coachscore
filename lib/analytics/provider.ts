/**
 * In-process analytics sinks (Phase 7). The no-op is the default forward sink
 * until PostHog is configured; the memory sink backs unit tests; the composite
 * fans an event out to several sinks without one failure blocking the others.
 * The live PostHog HTTP sink lives in `posthog-adapter.ts` (an I/O boundary).
 */

import type { AnalyticsProvider, CapturedEvent } from './types';

export class NoopAnalyticsProvider implements AnalyticsProvider {
  async capture(): Promise<void> {
    // Intentionally does nothing — analytics is not activated.
  }
}

export class MemoryAnalyticsProvider implements AnalyticsProvider {
  readonly events: CapturedEvent[] = [];
  async capture(event: CapturedEvent): Promise<void> {
    this.events.push(event);
  }
}

/** Fan out to several sinks; a slow or failing sink never blocks the others. */
export class CompositeAnalyticsProvider implements AnalyticsProvider {
  constructor(private readonly providers: readonly AnalyticsProvider[]) {}
  async capture(event: CapturedEvent): Promise<void> {
    await Promise.allSettled(this.providers.map((p) => p.capture(event)));
  }
}
