import { Disclaimer } from '@/components/disclaimer';
import { PremiumCard, ScoreRing, StatusBadge } from '@/components/ui';
import type { ProductReportView as ProductReport } from '@/lib/products';

/**
 * Uniform product report view (Phase 6 · premium restyle Phase B) — one
 * presentational, hook-free component for ReplayDoctor / BaseDoctor / WarPlan.
 * Score shown as a gradient ring; sections + recommendations on glass panels.
 */
export function ProductReportViewCard({ report }: { report: ProductReport }) {
  return (
    <section aria-labelledby="product-report-heading" className="space-y-5">
      <PremiumCard tone="gold" glowed className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2
              id="product-report-heading"
              className="text-xl font-bold text-white"
            >
              {report.title}
            </h2>
            <div className="mt-2">
              <StatusBadge tone={report.aiAuthored ? 'info' : 'inactive'}>
                {report.aiAuthored ? 'AI-drafted' : 'Deterministic'}
              </StatusBadge>
            </div>
          </div>
          {report.score ? (
            <ScoreRing value={report.score.value} label={report.score.label} />
          ) : null}
        </div>
        {report.score ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            {report.score.label}
          </p>
        ) : null}
      </PremiumCard>

      <PremiumCard tone="plain" className="p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-gold/80">
          Summary
        </h3>
        <p className="mt-1.5 text-sm text-[var(--fg)]/90">{report.summary}</p>
      </PremiumCard>

      {report.sections.map((section) => (
        <PremiumCard key={section.key} tone="plain" className="p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-violet-light">
            {section.title}
          </h3>
          {section.items.length === 0 ? (
            <p className="mt-1.5 text-sm text-[var(--muted)]">
              Nothing flagged here.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm text-[var(--fg)]/90">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-violet-light" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </PremiumCard>
      ))}

      <PremiumCard tone="violet" className="p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-gold/80">
          Recommendations
        </h3>
        {report.recommendations.length === 0 ? (
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            No recommendations.
          </p>
        ) : (
          <ol className="mt-2 space-y-2 text-sm text-[var(--fg)]/90">
            {report.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-gold/20 text-[11px] font-bold text-brand-gold-light">
                  {i + 1}
                </span>
                {rec}
              </li>
            ))}
          </ol>
        )}
      </PremiumCard>

      <footer className="border-t border-white/10 pt-3 text-xs text-[var(--muted)]">
        <p>
          Confidence {Math.round(report.confidence * 100)}% ·{' '}
          {report.aiAuthored
            ? 'AI-drafted, pending coach verification'
            : 'Deterministic analysis'}
        </p>
        <p className="mt-1">Version: {report.version}</p>
      </footer>

      <Disclaimer />
    </section>
  );
}
