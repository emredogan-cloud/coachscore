import type { ReportTeaser } from '@/lib/report';
import { PremiumCard, ScoreRing } from '@/components/ui';

/**
 * Free-teaser view (Phase 4 · premium + dark-native rebuild). Reveals the grade
 * + score (as a gradient score ring — the paywall centerpiece) and the single
 * top weakness, then shows the locked premium sections as the conversion
 * prompt. Presentational + hook-free. Dark-native, high-contrast (the old
 * light-theme `bg-amber-50`/`text-gray-500` classes were invisible in the
 * dark-only app — Phase L fix).
 */
export function TeaserView({ teaser }: { teaser: ReportTeaser }) {
  return (
    <section aria-labelledby="teaser-heading" className="space-y-5">
      <h2 id="teaser-heading" className="sr-only">
        Your free CoachScore teaser
      </h2>

      <PremiumCard tone="gold" glowed className="p-6">
        <div className="flex items-center justify-center gap-5">
          <ScoreRing
            value={teaser.overall}
            grade={teaser.grade}
            size={108}
            label="Your score"
          />
          <div className="text-left">
            <p
              className="text-5xl font-extrabold leading-none text-gold-gradient"
              data-testid="teaser-grade"
            >
              {teaser.grade}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {teaser.overall}/100
            </p>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-[var(--fg)]/90">
          {teaser.headline}
        </p>
      </PremiumCard>

      {teaser.topWeakness ? (
        <PremiumCard
          tone="plain"
          className="border-l-2 border-brand-gold/60 p-4"
        >
          <p className="text-sm text-[var(--fg)]/90">
            <span className="font-semibold text-brand-gold-light">
              Biggest opportunity:
            </span>{' '}
            {teaser.topWeakness.label} ({teaser.topWeakness.value}/100)
          </p>
        </PremiumCard>
      ) : null}

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-violet-light">
          Unlock the full report
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm text-[var(--muted)]">
          {teaser.lockedSections.map((section) => (
            <li key={section} className="flex items-center gap-2">
              <span aria-hidden>🔒</span>
              {section}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
