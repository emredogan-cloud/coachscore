import type { Metadata } from 'next';
import Link from 'next/link';
import { Disclaimer } from '@/components/disclaimer';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLdScript } from '@/components/seo/json-ld';
import { ShareButtons } from '@/components/share/share-buttons';
import {
  CountUp,
  MagicButton,
  PremiumCard,
  ScoreRing,
  StatusBadge,
} from '@/components/ui';
import {
  articleJsonLd,
  buildMetadata,
  canonicalUrl,
  CONTENT_REVISION_DATE,
} from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Sample CoachScore report — what you get | CoachScore',
  description:
    'An illustrative example of a CoachScore report: the grade, the seven ' +
    'dimension breakdown, and a prioritized upgrade roadmap. Example only — not ' +
    'a real account.',
  path: '/sample-report',
  type: 'article',
});

// Illustrative figures only — clearly labelled as an example, never a real
// player's account (roadmap §8 EEAT: real example reports, honestly marked).
const SAMPLE = {
  grade: 'B' as const,
  score: 74,
  townHall: 15,
  dimensions: [
    { label: 'Heroes', pct: 81 },
    { label: 'Offense', pct: 77 },
    { label: 'Defense', pct: 68 },
    { label: 'Progression (rush)', pct: 62 },
    { label: 'Walls', pct: 70 },
    { label: 'Clan value', pct: 88 },
  ],
  roadmap: [
    'Bring the Royal Champion up to the TH15 cap — biggest grade gain per Dark Elixir.',
    'Finish your two lagging key defenses to close the rush gap.',
    'Level your main attack’s core troops before starting walls.',
  ],
};

export default function SampleReportPage() {
  return (
    <article className="mx-auto max-w-md px-4 py-10">
      <JsonLdScript
        data={articleJsonLd({
          headline: 'Sample CoachScore report',
          description: metadata.description as string,
          url: canonicalUrl('/sample-report'),
          dateModified: CONTENT_REVISION_DATE,
        })}
      />
      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: 'Sample report', href: '/sample-report' },
        ]}
      />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
        A sample CoachScore report
      </h1>
      <div className="mt-2">
        <StatusBadge tone="warning">
          Illustrative example — not a real account
        </StatusBadge>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
        This is what a finished report looks like: a single grade, the seven
        dimension breakdown behind it, and a prioritized roadmap. The numbers
        below are made up to show the format.
      </p>

      <PremiumCard tone="gold" glowed className="mt-7 animate-score-reveal p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-gold/80">
              Town Hall {SAMPLE.townHall} · war goal
            </p>
            <p className="mt-1 text-2xl font-extrabold text-white">
              Grade {SAMPLE.grade}
            </p>
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              <CountUp
                to={SAMPLE.score}
                className="font-semibold text-gold-gradient"
              />
              /100 — solid, with a clear path to A.
            </p>
          </div>
          <ScoreRing
            value={SAMPLE.score}
            grade={SAMPLE.grade}
            label="Overall"
          />
        </div>
      </PremiumCard>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-white">
          Dimension breakdown
        </h2>
        <ul className="mt-3 space-y-2.5">
          {SAMPLE.dimensions.map((d) => (
            <li key={d.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--fg)]/90">{d.label}</span>
                <span className="font-medium text-[var(--muted)]">
                  {d.pct}%
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-violet-gradient"
                  style={{ width: `${d.pct}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-7">
        <h2 className="text-lg font-semibold text-white">
          Prioritized roadmap
        </h2>
        <ol className="mt-3 space-y-2 text-sm text-[var(--fg)]/90">
          {SAMPLE.roadmap.map((rec, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-gold/20 text-[11px] font-bold text-brand-gold-light">
                {i + 1}
              </span>
              {rec}
            </li>
          ))}
        </ol>
      </section>

      <PremiumCard tone="gold" glowed className="mt-9 p-5 text-center">
        <p className="font-medium text-white">
          Get your real grade — free, in under a minute.
        </p>
        <div className="mt-3">
          <MagicButton href="/onboarding" variant="gold">
            Score my account free
          </MagicButton>
        </div>
      </PremiumCard>

      <section className="mt-8" aria-labelledby="share-heading">
        <h2
          id="share-heading"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/80"
        >
          Share your result
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          One tap to share — or copy for Discord and clan chats.
        </p>
        <div className="mt-3">
          <ShareButtons
            url={canonicalUrl('/sample-report')}
            text={`I scored Grade ${SAMPLE.grade} (${SAMPLE.score}/100) on CoachScore — rate your Clash of Clans account free:`}
            imageUrl="/api/share/og"
          />
        </div>
      </section>

      <p className="mt-6 text-sm text-[var(--muted)]">
        Want to see how the grade is computed?{' '}
        <Link
          href="/methodology"
          className="text-brand-violet-light hover:text-white"
        >
          Read the methodology
        </Link>
        .
      </p>

      <div className="mt-6">
        <Disclaimer />
      </div>
    </article>
  );
}
