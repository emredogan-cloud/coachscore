/**
 * Event taxonomy (Phase 7). The closed set of analytics events the product
 * emits, grouped by funnel/conversion/usage category. Names mirror the roadmap
 * funnel instrumentation (`teaser_started`, `checkout_started`, `report_delivered`,
 * `share_card_generated`, `report_rated`, `reanalysis_started`). The service
 * rejects any name not in this registry, so the taxonomy stays disciplined.
 *
 * GDPR/KVKK: event properties must never carry PII — `PII_PROPERTY_KEYS` is the
 * denylist `stripPii` enforces.
 */

import type { AnalyticsProperties } from './types';

export const ANALYTICS_EVENT_NAMES = [
  // Acquisition funnel (PMF magic moment: landing → tag → score → report)
  'landing_viewed',
  'tag_submitted',
  'score_generated',
  'return_visit',
  'teaser_started',
  'teaser_completed',
  'signup_completed',
  'checkout_started',
  'report_delivered',
  // Engagement / product usage
  'report_rated',
  'reanalysis_started',
  'product_submitted',
  'product_report_viewed',
  // Viral / referral
  'share_card_generated',
  'share_clicked',
  'referral_visit',
  'referral_code_created',
  'referral_claimed',
  'referral_qualified',
  // Experimentation
  'experiment_exposed',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export type EventCategory =
  | 'funnel'
  | 'conversion'
  | 'product_usage'
  | 'viral'
  | 'referral'
  | 'experiment';

export const ANALYTICS_EVENTS: Readonly<
  Record<
    AnalyticsEventName,
    { readonly category: EventCategory; readonly description: string }
  >
> = {
  landing_viewed: {
    category: 'funnel',
    description: 'Visited a landing/SEO page.',
  },
  tag_submitted: {
    category: 'funnel',
    description: 'Submitted a player tag to analyze (the magic moment).',
  },
  score_generated: {
    category: 'funnel',
    description: 'An objective score was generated from the account.',
  },
  return_visit: {
    category: 'funnel',
    description: 'A returning visitor (seen on a prior session).',
  },
  teaser_started: {
    category: 'funnel',
    description: 'Began the free teaser intake.',
  },
  teaser_completed: {
    category: 'funnel',
    description: 'Saw the free teaser score.',
  },
  signup_completed: {
    category: 'funnel',
    description: 'Created an account (point of purchase).',
  },
  checkout_started: {
    category: 'conversion',
    description: 'Started a Stripe checkout.',
  },
  report_delivered: {
    category: 'conversion',
    description: 'A paid report was delivered.',
  },
  report_rated: {
    category: 'product_usage',
    description: 'Rated a delivered report.',
  },
  reanalysis_started: {
    category: 'product_usage',
    description: 'Re-analyzed a saved account.',
  },
  product_submitted: {
    category: 'product_usage',
    description: 'Submitted a ReplayDoctor/BaseDoctor/WarPlan.',
  },
  product_report_viewed: {
    category: 'product_usage',
    description: 'Viewed a product report.',
  },
  share_card_generated: {
    category: 'viral',
    description: 'Generated a shareable flex card.',
  },
  share_clicked: {
    category: 'viral',
    description: 'Clicked a social share target.',
  },
  referral_visit: {
    category: 'referral',
    description: 'Landed via a referral link (/r/{code}).',
  },
  referral_code_created: {
    category: 'referral',
    description: 'Created a referral code.',
  },
  referral_claimed: {
    category: 'referral',
    description: 'Claimed a referral code.',
  },
  referral_qualified: {
    category: 'referral',
    description: 'A referral converted (qualified).',
  },
  experiment_exposed: {
    category: 'experiment',
    description: 'Exposed to an experiment variant.',
  },
};

export function isAnalyticsEventName(name: string): name is AnalyticsEventName {
  return (ANALYTICS_EVENT_NAMES as readonly string[]).includes(name);
}

export function eventsByCategory(
  category: EventCategory,
): AnalyticsEventName[] {
  return ANALYTICS_EVENT_NAMES.filter(
    (n) => ANALYTICS_EVENTS[n].category === category,
  );
}

/** Property-key denylist (case-insensitive substring) — PII never enters events. */
export const PII_PROPERTY_KEYS = [
  'email',
  'name',
  'phone',
  'ip',
  'address',
  'password',
  'secret',
  'token',
  'playertag',
  'player_tag',
] as const;

function looksLikePii(key: string): boolean {
  const k = key.toLowerCase();
  return PII_PROPERTY_KEYS.some((bad) => k.includes(bad));
}

export interface PiiScrubResult {
  readonly clean: AnalyticsProperties;
  readonly dropped: readonly string[];
}

/** Remove any property whose key looks like PII; report what was dropped. */
export function stripPii(properties: AnalyticsProperties): PiiScrubResult {
  const clean: Record<string, AnalyticsProperties[string]> = {};
  const dropped: string[] = [];
  for (const [key, value] of Object.entries(properties)) {
    if (looksLikePii(key)) dropped.push(key);
    else clean[key] = value;
  }
  return { clean, dropped };
}
