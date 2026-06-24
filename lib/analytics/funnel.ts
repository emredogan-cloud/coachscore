/**
 * Funnel tracking (Phase 7). Declarative funnel definitions over the taxonomy +
 * a pure `computeFunnel` that turns per-event counts into step-by-step + overall
 * conversion rates. Used by the growth dashboard; no I/O, fully deterministic.
 */

import type { AnalyticsEventName } from './taxonomy';

export interface FunnelStep {
  readonly label: string;
  readonly event: AnalyticsEventName;
}

export interface FunnelDef {
  readonly key: string;
  readonly title: string;
  readonly steps: readonly FunnelStep[];
}

/** Visit → teaser → signup → checkout → paid report (roadmap master funnel). */
export const ACQUISITION_FUNNEL: FunnelDef = {
  key: 'acquisition',
  title: 'Acquisition → paid',
  steps: [
    { label: 'Landing', event: 'landing_viewed' },
    { label: 'Teaser started', event: 'teaser_started' },
    { label: 'Teaser completed', event: 'teaser_completed' },
    { label: 'Checkout started', event: 'checkout_started' },
    { label: 'Report delivered', event: 'report_delivered' },
  ],
};

/** Product-SKU funnel: submit → view → checkout. */
export const PRODUCT_FUNNEL: FunnelDef = {
  key: 'product',
  title: 'Specialized tool funnel',
  steps: [
    { label: 'Submitted', event: 'product_submitted' },
    { label: 'Report viewed', event: 'product_report_viewed' },
    { label: 'Checkout started', event: 'checkout_started' },
  ],
};

/** Viral loop: card generated → shared → referral claimed → qualified. */
export const VIRAL_FUNNEL: FunnelDef = {
  key: 'viral',
  title: 'Viral / referral loop',
  steps: [
    { label: 'Card generated', event: 'share_card_generated' },
    { label: 'Share clicked', event: 'share_clicked' },
    { label: 'Referral claimed', event: 'referral_claimed' },
    { label: 'Referral qualified', event: 'referral_qualified' },
  ],
};

export const FUNNELS: readonly FunnelDef[] = [
  ACQUISITION_FUNNEL,
  PRODUCT_FUNNEL,
  VIRAL_FUNNEL,
];

export interface FunnelStepResult {
  readonly label: string;
  readonly event: AnalyticsEventName;
  readonly count: number;
  /** Conversion from the previous step (1 for the first step). */
  readonly stepConversion: number;
  /** Conversion from the top of the funnel. */
  readonly cumulativeConversion: number;
}

export interface FunnelResult {
  readonly key: string;
  readonly title: string;
  readonly steps: readonly FunnelStepResult[];
  /** Overall top→bottom conversion. */
  readonly overallConversion: number;
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

/** Compute funnel conversions from a map of event-name → unique-count. */
export function computeFunnel(
  def: FunnelDef,
  counts: Readonly<Record<string, number>>,
): FunnelResult {
  const top = counts[def.steps[0]?.event ?? ''] ?? 0;
  let prev = top;
  const steps = def.steps.map((step, i): FunnelStepResult => {
    const count = counts[step.event] ?? 0;
    const result: FunnelStepResult = {
      label: step.label,
      event: step.event,
      count,
      stepConversion: i === 0 ? 1 : ratio(count, prev),
      cumulativeConversion: ratio(count, top),
    };
    prev = count;
    return result;
  });
  const last = steps[steps.length - 1]?.count ?? 0;
  return {
    key: def.key,
    title: def.title,
    steps,
    overallConversion: ratio(last, top),
  };
}
