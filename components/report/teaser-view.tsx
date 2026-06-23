import type { ReportTeaser } from '@/lib/report';

/**
 * Free-teaser view (Phase 4). Reveals the grade + score and the single top
 * weakness, then shows the locked premium sections as a conversion prompt.
 * Presentational + hook-free.
 */
export function TeaserView({ teaser }: { teaser: ReportTeaser }) {
  return (
    <section aria-labelledby="teaser-heading" className="space-y-5">
      <h2 id="teaser-heading" className="sr-only">
        Your free CoachScore teaser
      </h2>

      <div className="rounded-lg border border-gray-200 p-5 text-center dark:border-gray-800">
        <p className="text-6xl font-bold" data-testid="teaser-grade">
          {teaser.grade}
        </p>
        <p className="mt-1 text-lg text-gray-500">{teaser.overall}/100</p>
        <p className="mt-1 text-sm text-gray-500">{teaser.headline}</p>
      </div>

      {teaser.topWeakness ? (
        <div className="rounded-lg bg-amber-50 p-4 text-sm dark:bg-amber-950/30">
          <span className="font-semibold">Biggest opportunity:</span>{' '}
          {teaser.topWeakness.label} ({teaser.topWeakness.value}/100)
        </div>
      ) : null}

      <div>
        <h3 className="text-sm font-semibold uppercase text-gray-500">
          Unlock the full report
        </h3>
        <ul className="mt-2 space-y-1 text-sm">
          {teaser.lockedSections.map((section) => (
            <li key={section} className="flex items-center gap-2 text-gray-500">
              <span aria-hidden>🔒</span>
              {section}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
