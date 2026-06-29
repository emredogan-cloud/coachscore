'use client';

import { useEffect, useRef } from 'react';
import type { AnalyticsEventName } from '@/lib/analytics/taxonomy';

type Props = Record<string, string | number | boolean | null>;

/**
 * Fire-and-forget client analytics (PMF-correction sprint · Phase 6). POSTs a
 * taxonomy event to /api/analytics/track, which forwards to PostHog when
 * configured and persists when the DB is on — and is a clean no-op otherwise.
 * Errors are swallowed: instrumentation must never break the funnel. Uses
 * `sendBeacon` where available so events survive navigation/unload.
 */
export function track(name: AnalyticsEventName, properties?: Props): void {
  if (typeof window === 'undefined') return;
  try {
    const body = JSON.stringify({
      name,
      properties,
      context: { source: 'web' },
    });
    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(
        '/api/analytics/track',
        new Blob([body], { type: 'application/json' }),
      );
    } else {
      void fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => undefined);
    }
  } catch {
    /* never throw from instrumentation */
  }
}

/** Fire a single event once on mount (e.g. `landing_viewed`, `referral_visit`). */
export function TrackOnMount({ event }: { event: AnalyticsEventName }): null {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track(event);
  }, [event]);
  return null;
}

/** Emit `return_visit` when the visitor has been seen on a prior session. */
export function ReturnVisitTracker(): null {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    try {
      if (localStorage.getItem('cs_seen') === '1') track('return_visit');
      else localStorage.setItem('cs_seen', '1');
    } catch {
      /* storage blocked — skip */
    }
  }, []);
  return null;
}
