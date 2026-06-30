import type { ReactNode } from 'react';
import type { SubScores } from '@/lib/core';
import type { RenderableReport } from '@/lib/report';
import { benchmarkVsMaxed } from '@/lib/benchmark';
import {
  DimensionBar,
  GradeBadge,
  PremiumCard,
  ScoreRing,
  SectionDivider,
} from '@/components/ui';

/**
 * Full report view (P1-D — premium redesign). Brings the real deliverable up to
 * the sample report's quality: a grade badge + score ring, dimension bars, a
 * clean prioritized roadmap with human-readable element names, and tasteful
 * trust indicators — and, crucially, NO internal QA metadata leaked to the
 * buyer (the old footer exposed "Reference verified for paid use: no / flagged
 * for human review / Version", which alarms customers). Presentational +
 * hook-free → server-rendered.
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

// Abstract, IP-safe glyph (no game art) for the dimension rows.
const shieldGlyph: ReactNode = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M12 2l8 3v6c0 5-3.5 8-8 11-4.5-3-8-6-8-11V5l8-3z" />
  </svg>
);

export function ReportView({ report }: { report: RenderableReport }) {
  // HR-4 — objective "you vs a maxed base" benchmark (reuses the tested lib).
  const subScoreMap = Object.fromEntries(
    report.subScores.map((s) => [s.key, s.value]),
  ) as unknown as SubScores;
  const bench = benchmarkVsMaxed(subScoreMap, report.overall, report.townHall);

  return (
    <section aria-labelledby="report-heading" className="space-y-7">
      <h2 id="report-heading" className="sr-only">
        CoachScore Report
      </h2>

      {/* Score header */}
      <PremiumCard tone="gold" glowed className="animate-score-reveal p-6">
        <div className="flex items-center justify-center gap-5">
          <ScoreRing
            value={report.overall}
            grade={report.grade}
            size={116}
            label="Your CoachScore"
          />
          <div className="text-left">
            <GradeBadge grade={report.grade} size="md" className="mb-2" />
            <p className="text-sm text-[var(--muted)]">
              Town Hall {report.townHall} · {report.rushLabel}
            </p>
            <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
              Goal: {report.goal}
            </p>
          </div>
        </div>
        {/* HR-4 — vs a maxed base for your Town Hall */}
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          {bench.headline}
          {bench.biggest
            ? ` Biggest gap to a maxed base: ${bench.biggest.label}.`
            : ''}
        </p>
      </PremiumCard>

      {/* Diagnosis */}
      <PremiumCard tone="violet" className="p-5">
        <SectionDivider className="mb-3">Diagnosis</SectionDivider>
        <p className="text-[15px] leading-relaxed text-[var(--fg)]/90">
          {report.diagnosis}
        </p>
      </PremiumCard>

      {/* Dimension breakdown — bars */}
      <PremiumCard tone="plain" className="p-5">
        <SectionDivider className="mb-4">Dimension breakdown</SectionDivider>
        <ul className="space-y-3.5">
          {report.subScores.map((s) => {
            const pct = s.value === null ? null : Math.round(s.value);
            if (pct === null) {
              return (
                <li
                  key={s.key}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-semibold text-white/90">{s.label}</span>
                  <span className="font-medium text-[var(--muted)]">
                    Not scored
                  </span>
                </li>
              );
            }
            return (
              <li key={s.key}>
                <DimensionBar
                  label={s.label}
                  percent={pct}
                  icon={shieldGlyph}
                />
              </li>
            );
          })}
        </ul>
      </PremiumCard>

      {/* Strengths / weaknesses */}
      <div className="grid gap-5 sm:grid-cols-2">
        <PremiumCard tone="plain" className="p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-grade-a">
            Strengths
          </h3>
          {report.strengths.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">
              None standing out yet.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {report.strengths.map((s) => (
                <li key={s.key} className="flex justify-between gap-2">
                  <span className="text-[var(--fg)]/90">{s.label}</span>
                  <span className="font-medium text-white">{s.value}</span>
                </li>
              ))}
            </ul>
          )}
        </PremiumCard>
        <PremiumCard tone="plain" className="p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-gold-light">
            Weaknesses
          </h3>
          {report.weaknesses.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">
              No dominant weakness.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {report.weaknesses.map((w) => (
                <li key={w.key} className="flex justify-between gap-2">
                  <span className="text-[var(--fg)]/90">{w.label}</span>
                  <span className="font-medium text-white">{w.value}</span>
                </li>
              ))}
            </ul>
          )}
        </PremiumCard>
      </div>

      {/* Upgrade roadmap */}
      <div>
        <SectionDivider className="mb-4">Prioritized roadmap</SectionDivider>
        {report.roadmap.length === 0 ? (
          <p className="text-center text-sm text-[var(--muted)]">
            Your account is maxed for this Town Hall under this goal.
          </p>
        ) : (
          <ol className="space-y-2.5">
            {report.roadmap.map((step) => (
              <li key={`${step.rank}-${step.elementId}`}>
                <PremiumCard
                  tone="plain"
                  className="flex items-start gap-3 p-3.5"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-gradient text-[11px] font-extrabold text-ink-950 shadow-glow-gold-sm">
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
        <PremiumCard tone="violet" className="p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-violet-light">
            Coach notes
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--fg)]/90">
            {report.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </PremiumCard>
      ) : null}

      {/* Tasteful trust footer — confidence only, no internal QA flags */}
      <footer className="border-t border-white/8 pt-3 text-center text-xs text-[var(--muted)]">
        AI-drafted from your in-game data · transparent deterministic engine ·
        confidence {Math.round(report.confidence * 100)}%
      </footer>
    </section>
  );
}
