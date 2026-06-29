import type { RenderableReport } from '@/lib/report';
import { PremiumCard, ScoreRing } from '@/components/ui';

/**
 * Full report view (P1-D — premium redesign). Brings the real deliverable up to
 * the sample report's quality: a score ring, dimension bars, a clean prioritized
 * roadmap with human-readable element names, and tasteful trust indicators —
 * and, crucially, NO internal QA metadata leaked to the buyer (the old footer
 * exposed "Reference verified for paid use: no / flagged for human review /
 * Version", which alarms customers). Presentational + hook-free → server-rendered.
 */

const ELEMENT_LABELS: Readonly<Record<string, string>> = {
  barbarianKing: 'Barbarian King',
  archerQueen: 'Archer Queen',
  grandWarden: 'Grand Warden',
  royalChampion: 'Royal Champion',
  minionPrince: 'Minion Prince',
  dragonDuke: 'Dragon Duke',
  'meta-offense': 'Offense (army & lab)',
  'key-defense': 'Defense',
};

function humanize(id: string): string {
  if (ELEMENT_LABELS[id]) return ELEMENT_LABELS[id];
  return id
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ReportView({ report }: { report: RenderableReport }) {
  return (
    <section aria-labelledby="report-heading" className="space-y-6">
      <h2 id="report-heading" className="sr-only">
        CoachScore Report
      </h2>

      {/* Score header */}
      <PremiumCard tone="gold" glowed className="p-6">
        <div className="flex items-center justify-center gap-5">
          <ScoreRing
            value={report.overall}
            grade={report.grade}
            size={116}
            label="Your CoachScore"
          />
          <div className="text-left">
            <p className="text-5xl font-extrabold leading-none text-gold-gradient">
              {report.grade}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Town Hall {report.townHall} · {report.rushLabel}
            </p>
            <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
              Goal: {report.goal}
            </p>
          </div>
        </div>
      </PremiumCard>

      {/* Diagnosis */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-gold/80">
          Diagnosis
        </h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--fg)]/90">
          {report.diagnosis}
        </p>
      </div>

      {/* Dimension breakdown — bars */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-gold/80">
          Dimension breakdown
        </h3>
        <ul className="mt-3 space-y-2.5">
          {report.subScores.map((s) => {
            const pct = s.value === null ? null : Math.round(s.value);
            return (
              <li key={s.key}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-[var(--fg)]/90">{s.label}</span>
                  <span className="font-semibold text-white">
                    {pct === null ? 'Not scored' : `${pct}%`}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-violet-gradient"
                    style={{ width: `${pct ?? 0}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Strengths / weaknesses */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-gold/80">
            Strengths
          </h3>
          {report.strengths.length === 0 ? (
            <p className="mt-1.5 text-sm text-[var(--muted)]">
              None standing out yet.
            </p>
          ) : (
            <ul className="mt-1.5 space-y-1 text-sm">
              {report.strengths.map((s) => (
                <li key={s.key} className="flex justify-between gap-2">
                  <span className="text-[var(--fg)]/90">{s.label}</span>
                  <span className="font-medium text-white">{s.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-gold/80">
            Weaknesses
          </h3>
          {report.weaknesses.length === 0 ? (
            <p className="mt-1.5 text-sm text-[var(--muted)]">
              No dominant weakness.
            </p>
          ) : (
            <ul className="mt-1.5 space-y-1 text-sm">
              {report.weaknesses.map((w) => (
                <li key={w.key} className="flex justify-between gap-2">
                  <span className="text-[var(--fg)]/90">{w.label}</span>
                  <span className="font-medium text-white">{w.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Upgrade roadmap */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-gold/80">
          Upgrade roadmap
        </h3>
        {report.roadmap.length === 0 ? (
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            Your account is maxed for this Town Hall under this goal.
          </p>
        ) : (
          <ol className="mt-3 space-y-2.5">
            {report.roadmap.map((step) => (
              <li key={`${step.rank}-${step.elementId}`}>
                <PremiumCard
                  tone="plain"
                  className="flex items-start gap-3 p-3.5"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-gold/20 text-[11px] font-bold text-brand-gold-light">
                    {step.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {humanize(step.elementId)}{' '}
                      <span className="font-normal text-[var(--muted)]">
                        {step.fromLevel} → {step.toLevel}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      {step.rationale}
                    </p>
                  </div>
                </PremiumCard>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Recommendations */}
      {report.recommendations.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-gold/80">
            Coach notes
          </h3>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-[var(--fg)]/90">
            {report.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Tasteful trust footer — confidence only, no internal QA flags */}
      <footer className="border-t border-white/10 pt-3 text-xs text-[var(--muted)]">
        AI-drafted from your in-game data · transparent deterministic engine ·
        confidence {Math.round(report.confidence * 100)}%
      </footer>
    </section>
  );
}
