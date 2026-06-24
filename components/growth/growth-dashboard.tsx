import type { GrowthDashboard } from '@/lib/growth';

/**
 * Growth dashboard (Phase 7) — presentational, hook-free, server-rendered. KPI
 * cards, the funnel breakdowns, the experiment assignment split, and the
 * referral / K-factor summary. One component for the analytics, funnel,
 * experiment, and referral views the admin growth page composes.
 */

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function cents(value: number): string {
  return `$${(value / 100).toFixed(2)}`;
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
      <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

export function GrowthDashboardView({
  dashboard,
}: {
  dashboard: GrowthDashboard;
}) {
  const { kpis, funnels, experiments, referrals } = dashboard;
  return (
    <div className="space-y-10">
      <section aria-labelledby="kpis-heading">
        <h2
          id="kpis-heading"
          className="text-sm font-semibold uppercase text-gray-500"
        >
          Key metrics
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Teaser → paid" value={pct(kpis.teaserToPaid)} />
          <KpiCard label="Visit → teaser" value={pct(kpis.visitToTeaser)} />
          <KpiCard label="K-factor" value={referrals.kFactor.toFixed(2)} />
          <KpiCard
            label="Referral payouts"
            value={cents(referrals.rewardCents)}
          />
        </div>
      </section>

      <section aria-labelledby="funnels-heading">
        <h2
          id="funnels-heading"
          className="text-sm font-semibold uppercase text-gray-500"
        >
          Funnels
        </h2>
        <div className="mt-3 space-y-6">
          {funnels.map((funnel) => (
            <div key={funnel.key}>
              <h3 className="font-medium">{funnel.title}</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {funnel.steps.map((step) => (
                  <li key={step.event} className="flex items-center gap-3">
                    <span className="w-40 text-gray-500">{step.label}</span>
                    <span className="w-12 text-right font-medium">
                      {step.count}
                    </span>
                    <span className="text-xs text-gray-400">
                      {pct(step.cumulativeConversion)} of top
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="experiments-heading">
        <h2
          id="experiments-heading"
          className="text-sm font-semibold uppercase text-gray-500"
        >
          Experiments
        </h2>
        {experiments.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No assignments yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {experiments.map((exp) => (
              <li key={exp.experimentKey}>
                <span className="font-medium">{exp.experimentKey}</span>
                <span className="ml-2 text-gray-500">
                  {exp.variants
                    .map((v) => `${v.variant}: ${v.count}`)
                    .join(' · ')}{' '}
                  ({exp.total} total)
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="referrals-heading">
        <h2
          id="referrals-heading"
          className="text-sm font-semibold uppercase text-gray-500"
        >
          Referrals
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {referrals.referrers} referrers · {referrals.referrals} referrals ·{' '}
          {referrals.qualified} qualified · K-factor{' '}
          {referrals.kFactor.toFixed(2)}
        </p>
      </section>
    </div>
  );
}
