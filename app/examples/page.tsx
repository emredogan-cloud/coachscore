import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import {
  HeroBanner,
  PremiumCard,
  ScoreRing,
  StatusBadge,
} from '@/components/ui';
import { TRANSFORMATION_EXAMPLES } from '@/lib/proof/examples';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Example transformations — what a CoachScore roadmap looks like',
  description:
    'Illustrative before/after examples of Clash of Clans accounts following a ' +
    'CoachScore upgrade roadmap. Example format only — not real accounts.',
  path: '/examples',
});

export default function ExamplesPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: 'Examples', href: '/examples' },
        ]}
      />
      <div className="mt-3">
        <HeroBanner
          crest
          headline="What a CoachScore roadmap looks like"
          tagline="Example transformations"
        />
      </div>

      {/* PROOF-P0 — synthetic content must be clearly labelled */}
      <div className="mt-5 flex justify-center">
        <StatusBadge tone="gold">
          Illustrative examples — not real accounts
        </StatusBadge>
      </div>
      <p className="mt-3 text-center text-sm text-[var(--muted)]">
        These show the <em>format</em> and the kind of improvement the roadmap
        prioritizes. The numbers are constructed to demonstrate the product — we
        don&apos;t publish fake reviews or invented user outcomes.
      </p>

      <div className="mt-8 space-y-6">
        {TRANSFORMATION_EXAMPLES.map((ex) => (
          <PremiumCard key={ex.id} tone="violet" className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">{ex.title}</h2>
              <span className="text-xs uppercase tracking-wider text-[var(--muted)]">
                ~{ex.days} days
              </span>
            </div>
            <p className="mt-0.5 text-xs uppercase tracking-wider text-brand-gold/80">
              TH{ex.townHall} · {ex.goal}
            </p>

            <div className="mt-4 flex items-center justify-center gap-4">
              <div className="flex flex-col items-center">
                <ScoreRing
                  value={ex.before.overall}
                  grade={ex.before.grade}
                  size={88}
                  label="Before"
                />
                <span className="mt-1 text-[11px] uppercase tracking-wider text-[var(--muted)]">
                  Before
                </span>
              </div>
              <span aria-hidden className="text-2xl text-brand-gold">
                →
              </span>
              <div className="flex flex-col items-center">
                <ScoreRing
                  value={ex.after.overall}
                  grade={ex.after.grade}
                  size={88}
                  label="After"
                />
                <span className="mt-1 text-[11px] uppercase tracking-wider text-brand-gold-light">
                  After
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm text-[var(--fg)]/90">{ex.summary}</p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
              {ex.keyMoves.map((m) => (
                <li key={m} className="flex items-start gap-2">
                  <span aria-hidden className="text-brand-gold">
                    ✓
                  </span>
                  {m}
                </li>
              ))}
            </ul>
          </PremiumCard>
        ))}
      </div>

      {/* PROOF-P1 — methodology as the real trust spine */}
      <section className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/80">
          Why you can trust the grade
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Examples aside, the real trust signal is the method: every grade comes
          from a transparent, deterministic engine — the same inputs always
          produce the same score — built from your verified in-game data.{' '}
          <Link
            href="/methodology"
            className="text-brand-violet-light hover:text-white"
          >
            See how scoring works
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
