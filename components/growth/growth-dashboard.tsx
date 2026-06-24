import type { GrowthDashboard } from '@/lib/growth';
import { MetricCard, PremiumCard } from '@/components/ui';

/**
 * Growth dashboard (Phase 7 · premium restyle Phase B) — KPI metric cards, the
 * funnel breakdowns as conversion bars, experiment splits, and referral
 * summary. Presentational, hook-free, server-rendered.
 */

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
function cents(value: number): string {
  return `$${(value / 100).toFixed(2)}`;
}

export function GrowthDashboardView({
  dashboard,
}: {
  dashboard: GrowthDashboard;
}) {
  const { kpis, funnels, experiments, referrals } = dashboard;
  return (
    <div className="space-y-9">
      <section aria-labelledby="kpis-heading">
        <h2
          id="kpis-heading"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/80"
        >
          Key metrics
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <MetricCard
            label="Teaser → paid"
            value={pct(kpis.teaserToPaid)}
            tone="gold"
          />
          <MetricCard label="Visit → teaser" value={pct(kpis.visitToTeaser)} />
          <MetricCard label="K-factor" value={referrals.kFactor.toFixed(2)} />
          <MetricCard
            label="Referral payouts"
            value={cents(referrals.rewardCents)}
          />
        </div>
      </section>

      <section aria-labelledby="funnels-heading">
        <h2
          id="funnels-heading"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/80"
        >
          Funnels
        </h2>
        <div className="mt-3 space-y-4">
          {funnels.map((funnel) => (
            <PremiumCard key={funnel.key} tone="plain" className="p-4">
              <h3 className="text-sm font-semibold text-white">
                {funnel.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {funnel.steps.map((step) => (
                  <li key={step.event}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--fg)]/80">{step.label}</span>
                      <span className="text-[var(--muted)]">
                        {step.count} · {pct(step.cumulativeConversion)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-violet-gradient"
                        style={{
                          width: `${Math.max(2, step.cumulativeConversion * 100)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </PremiumCard>
          ))}
        </div>
      </section>

      <section aria-labelledby="experiments-heading">
        <h2
          id="experiments-heading"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/80"
        >
          Experiments
        </h2>
        {experiments.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            No assignments yet.
          </p>
        ) : (
          <PremiumCard tone="plain" className="mt-3 space-y-2 p-4 text-sm">
            {experiments.map((exp) => (
              <div key={exp.experimentKey}>
                <span className="font-medium text-white">
                  {exp.experimentKey}
                </span>
                <span className="ml-2 text-[var(--muted)]">
                  {exp.variants
                    .map((v) => `${v.variant}: ${v.count}`)
                    .join(' · ')}{' '}
                  ({exp.total} total)
                </span>
              </div>
            ))}
          </PremiumCard>
        )}
      </section>

      <section aria-labelledby="referrals-heading">
        <h2
          id="referrals-heading"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/80"
        >
          Referrals
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {referrals.referrers} referrers · {referrals.referrals} referrals ·{' '}
          {referrals.qualified} qualified · K-factor{' '}
          {referrals.kFactor.toFixed(2)}
        </p>
      </section>
    </div>
  );
}
