/**
 * Experiment + feature-flag registry (Phase 7). The pre-registered experiments
 * from the roadmap's experimentation system (§11) — each with a hypothesis and a
 * single success metric. The highest-leverage ones (teaser→paid, the viral loop)
 * lead. Flags gate growth features that should ship dark or roll out gradually.
 */

import type { Experiment, FeatureFlag } from './types';

const EVEN = (...keys: string[]) => keys.map((key) => ({ key, weight: 1 }));

export const EXPERIMENTS: readonly Experiment[] = [
  {
    key: 'teaser_reveal_depth',
    title: 'Teaser reveal depth',
    hypothesis:
      'Naming the single biggest weakness in the free teaser lifts teaser→paid vs. showing only the grade.',
    metric: 'teaser_to_paid',
    status: 'running',
    variants: EVEN('control', 'named_weakness'),
  },
  {
    key: 'paywall_placement',
    title: 'Paywall placement',
    hypothesis:
      'Showing the paywall after the score but before the roadmap converts better than after the full teaser.',
    metric: 'teaser_to_paid',
    status: 'running',
    variants: EVEN('after_teaser', 'before_roadmap'),
  },
  {
    key: 'pricing_anchor',
    title: 'Pricing anchor',
    hypothesis:
      'Anchoring the Pro tier ($29) next to Standard ($12) lifts AOV and Standard mix.',
    metric: 'aov',
    status: 'running',
    variants: EVEN('control', 'anchor_pro'),
  },
  {
    key: 'referral_incentive',
    title: 'Referral incentive',
    hypothesis:
      'A credit-for-referrer offer raises K-factor without cannibalizing margin.',
    metric: 'k_factor',
    status: 'running',
    variants: EVEN('control', 'credit_referrer'),
  },
  {
    key: 'default_tier',
    title: 'Default tier',
    hypothesis:
      'Defaulting to the human-verified tier raises AOV more than it costs in conversion.',
    metric: 'aov',
    status: 'draft',
    variants: EVEN('ai_only', 'human_default'),
  },
  {
    key: 'seo_cta_variant',
    title: 'SEO page CTA',
    hypothesis:
      'An embedded mini-checker on SEO pages converts better than a text CTA.',
    metric: 'seo_to_teaser',
    status: 'running',
    variants: EVEN('text_cta', 'embedded_checker'),
  },
];

export const FEATURE_FLAGS: readonly FeatureFlag[] = [
  {
    key: 'referrals_enabled',
    description: 'Referral code creation + claim flows.',
    enabled: true,
    rolloutPct: 100,
  },
  {
    key: 'lifecycle_email_enabled',
    description: 'Lifecycle / winback email sends (also gated on Resend).',
    enabled: true,
    rolloutPct: 100,
  },
  {
    key: 'programmatic_seo_enabled',
    description: 'Programmatic per-Town-Hall SEO guide pages.',
    enabled: true,
    rolloutPct: 100,
  },
  {
    key: 'share_cards_enabled',
    description: 'Shareable flex cards + social share targets.',
    enabled: true,
    rolloutPct: 100,
  },
];

export function getExperiment(key: string): Experiment | null {
  return EXPERIMENTS.find((e) => e.key === key) ?? null;
}

export function getFlag(key: string): FeatureFlag | null {
  return FEATURE_FLAGS.find((f) => f.key === key) ?? null;
}
