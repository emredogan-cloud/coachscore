/**
 * Growth metrics aggregation (Phase 7). Pure functions that turn persisted
 * analytics events / experiment assignments / referrals into the funnel,
 * experiment, referral, and KPI views the growth dashboard renders. No I/O —
 * the dashboard handler fetches rows and passes them here.
 */

import {
  ACQUISITION_FUNNEL,
  computeFunnel,
  FUNNELS,
  type FunnelResult,
} from '@/lib/analytics';
import type {
  AnalyticsEventRow,
  ExperimentAssignmentRow,
  ReferralRow,
} from '@/lib/db';

/** Distinct subjects (user or anon) that fired each event. */
export function uniqueCountByEvent(
  events: readonly AnalyticsEventRow[],
): Record<string, number> {
  const seen = new Map<string, Set<string>>();
  for (const e of events) {
    const subject = e.userId ?? e.anonId ?? `row:${e.id}`;
    const set = seen.get(e.name) ?? new Set<string>();
    set.add(subject);
    seen.set(e.name, set);
  }
  const out: Record<string, number> = {};
  for (const [name, set] of seen) out[name] = set.size;
  return out;
}

export function funnelMetrics(
  events: readonly AnalyticsEventRow[],
): FunnelResult[] {
  const counts = uniqueCountByEvent(events);
  return FUNNELS.map((def) => computeFunnel(def, counts));
}

export interface KpiSummary {
  /** Master metric — paid reports / teaser completions. */
  readonly teaserToPaid: number;
  readonly visitToTeaser: number;
  readonly landings: number;
  readonly teasers: number;
  readonly purchases: number;
}

export function kpiSummary(events: readonly AnalyticsEventRow[]): KpiSummary {
  const c = uniqueCountByEvent(events);
  const landings = c.landing_viewed ?? 0;
  const teasers = c.teaser_completed ?? 0;
  const purchases = c.report_delivered ?? 0;
  return {
    landings,
    teasers,
    purchases,
    visitToTeaser: landings === 0 ? 0 : teasers / landings,
    teaserToPaid: teasers === 0 ? 0 : purchases / teasers,
  };
}

export interface ExperimentMetric {
  readonly experimentKey: string;
  readonly total: number;
  readonly variants: readonly {
    readonly variant: string;
    readonly count: number;
  }[];
}

export function experimentMetrics(
  assignments: readonly ExperimentAssignmentRow[],
): ExperimentMetric[] {
  const byExp = new Map<string, Map<string, number>>();
  for (const a of assignments) {
    const variants = byExp.get(a.experimentKey) ?? new Map<string, number>();
    variants.set(a.variant, (variants.get(a.variant) ?? 0) + 1);
    byExp.set(a.experimentKey, variants);
  }
  return [...byExp.entries()].map(([experimentKey, variants]) => ({
    experimentKey,
    total: [...variants.values()].reduce((s, n) => s + n, 0),
    variants: [...variants.entries()].map(([variant, count]) => ({
      variant,
      count,
    })),
  }));
}

export interface ReferralMetric {
  readonly referrers: number;
  readonly referrals: number;
  readonly qualified: number;
  readonly rewardCents: number;
  /** Qualified conversions per referrer — the K-factor proxy. */
  readonly kFactor: number;
}

export function referralMetrics(
  referrals: readonly ReferralRow[],
): ReferralMetric {
  const referrers = new Set(referrals.map((r) => r.referrerUserId)).size;
  const qualified = referrals.filter(
    (r) => r.status === 'qualified' || r.status === 'rewarded',
  ).length;
  const rewardCents = referrals.reduce((s, r) => s + (r.rewardCents ?? 0), 0);
  return {
    referrers,
    referrals: referrals.length,
    qualified,
    rewardCents,
    kFactor: referrers === 0 ? 0 : qualified / referrers,
  };
}

export interface GrowthDashboard {
  readonly kpis: KpiSummary;
  readonly funnels: readonly FunnelResult[];
  readonly experiments: readonly ExperimentMetric[];
  readonly referrals: ReferralMetric;
}

export function buildGrowthDashboard(input: {
  readonly events: readonly AnalyticsEventRow[];
  readonly assignments: readonly ExperimentAssignmentRow[];
  readonly referrals: readonly ReferralRow[];
}): GrowthDashboard {
  return {
    kpis: kpiSummary(input.events),
    funnels: funnelMetrics(input.events),
    experiments: experimentMetrics(input.assignments),
    referrals: referralMetrics(input.referrals),
  };
}

/** The headline funnel (acquisition) computed on its own — convenience. */
export function acquisitionFunnel(
  events: readonly AnalyticsEventRow[],
): FunnelResult {
  return computeFunnel(ACQUISITION_FUNNEL, uniqueCountByEvent(events));
}
