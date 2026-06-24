/**
 * PostHog HTTP sink (Phase 7) — the real analytics I/O boundary, exercised at
 * activation (NEXT_PUBLIC_POSTHOG_KEY), not in unit tests. Captures via the
 * public `/capture/` endpoint over fetch (no SDK), defaulting to the EU cloud
 * for data residency. Outside coverage, like the other third-party adapters.
 */

import { isAnalyticsConfigured } from '@/lib/activation';
import { optionalEnv, requireEnv } from '@/lib/env';
import { NoopAnalyticsProvider } from './provider';
import type { AnalyticsProvider, CapturedEvent } from './types';

export class PostHogProvider implements AnalyticsProvider {
  constructor(
    private readonly apiKey: string,
    private readonly host: string,
  ) {}

  async capture(event: CapturedEvent): Promise<void> {
    await fetch(`${this.host.replace(/\/$/, '')}/capture/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        api_key: this.apiKey,
        event: event.name,
        distinct_id: event.distinctId,
        properties: {
          ...event.properties,
          source: event.source,
          $lib: 'coachscore-server',
        },
      }),
    });
  }
}

export function createPostHogProvider(): PostHogProvider {
  return new PostHogProvider(
    requireEnv('NEXT_PUBLIC_POSTHOG_KEY'),
    optionalEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://eu.posthog.com'),
  );
}

/** The live forward sink: PostHog when configured, otherwise a no-op. */
export function defaultAnalyticsProvider(): AnalyticsProvider {
  return isAnalyticsConfigured()
    ? createPostHogProvider()
    : new NoopAnalyticsProvider();
}
