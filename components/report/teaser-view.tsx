import type { ReportTeaser } from '@/lib/report';
import { deriveArchetype } from '@/lib/identity';
import { EyebrowPill, GradeBadge, PremiumCard } from '@/components/ui';
import { ScoreReveal } from './score-reveal';

/**
 * Free-teaser view (Phase 4 · premium + dark-native rebuild). Reveals the grade
 * + score (as an animated gradient score ring — the paywall centerpiece) and
 * the single top weakness, then shows the locked premium sections as the
 * conversion prompt. Presentational + hook-free. Dark-native, high-contrast.
 */
export function TeaserView({ teaser }: { teaser: ReportTeaser }) {
  return (
    <section aria-labelledby="teaser-heading" className="space-y-5">
      <h2 id="teaser-heading" className="sr-only">
        Your free CoachScore teaser
      </h2>

      <PremiumCard tone="gold" glowed className="p-6">
        <div className="flex items-center justify-center gap-5">
          <ScoreReveal
            value={teaser.overall}
            grade={teaser.grade}
            size={108}
            label="Your score"
          />
          <div className="text-left">
            <GradeBadge grade={teaser.grade} size="md" className="mb-1" />
            <p
              className="text-sm text-[var(--muted)]"
              data-testid="teaser-grade"
            >
              {teaser.overall}/100
            </p>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-[var(--fg)]/90">
          {teaser.headline}
        </p>
        {/* EMO-P2 — shareable player identity */}
        <p className="mt-3 text-center">
          <EyebrowPill tone="violet">
            {deriveArchetype(teaser.goal, teaser.grade).name}
          </EyebrowPill>
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

      <PremiumCard tone="violet" className="p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-violet-light">
          Unlock the full report
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
          {teaser.lockedSections.map((section) => (
            <li key={section} className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-gold/15 text-brand-gold-light"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M17 9V7a5 5 0 0 0-10 0v2H5v13h14V9h-2zM9 7a3 3 0 0 1 6 0v2H9V7z" />
                </svg>
              </span>
              {section}
            </li>
          ))}
        </ul>
      </PremiumCard>
    </section>
  );
}
