import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Breadcrumbs,
  EyebrowPill,
  GradeBadge,
  MagicButton,
  PremiumCard,
  ScoreRing,
  SectionDivider,
  TrustBar,
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

// Abstract, IP-safe SVG glyph (no game art) reused for trust rows + bullets.
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

export default function ExamplesPage() {
  return (
    <article className="mx-auto max-w-md px-4 py-10">
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Examples' }]}
      />

      <div className="mt-4">
        <EyebrowPill tone="violet">
          Illustrative examples — not real accounts
        </EyebrowPill>
      </div>

      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
        What a <span className="text-violet-gradient">CoachScore</span> roadmap
        looks like
      </h1>

      {/* PROOF-P0 — synthetic content must be clearly labelled */}
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
        These show the <em>format</em> and the kind of improvement the roadmap
        prioritizes. The numbers are constructed to demonstrate the product — we
        don&apos;t publish fake reviews or invented user outcomes.
      </p>

      {/* Sample grade card — the shape of every result */}
      <PremiumCard tone="gold" glowed className="mt-7 animate-score-reveal p-6">
        <div className="flex items-start gap-4">
          <GradeBadge grade="B" size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-gold/80">
              The shape of every result
            </p>
            <p className="mt-1 text-2xl font-extrabold text-white">
              A grade, then a plan
            </p>
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              One letter you can act on — and an ordered roadmap to raise it.
            </p>
          </div>
          <ScoreRing value={76} grade="B" size={104} label="Overall" />
        </div>
      </PremiumCard>

      <SectionDivider className="mt-10">Example transformations</SectionDivider>

      <div className="mt-7 space-y-6">
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
                  <span aria-hidden className="mt-0.5 shrink-0 text-brand-gold">
                    {shieldGlyph}
                  </span>
                  {m}
                </li>
              ))}
            </ul>
          </PremiumCard>
        ))}
      </div>

      {/* PROOF-P1 — methodology as the real trust spine */}
      <SectionDivider className="mt-12">
        Why you can trust the grade
      </SectionDivider>
      <PremiumCard tone="plain" className="mt-7 p-6">
        <p className="text-[15px] leading-relaxed text-[var(--muted)]">
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
      </PremiumCard>

      <TrustBar
        className="mt-6"
        items={[
          {
            icon: shieldGlyph,
            title: 'Deterministic',
            subtitle: 'Same inputs, same score',
          },
          {
            icon: shieldGlyph,
            title: 'Your real data',
            subtitle: 'From your in-game account',
          },
          {
            icon: shieldGlyph,
            title: 'No fake outcomes',
            subtitle: 'Examples clearly labelled',
          },
          {
            icon: shieldGlyph,
            title: 'Transparent method',
            subtitle: 'Published scoring weights',
          },
        ]}
      />

      {/* CTA banner */}
      <PremiumCard tone="gold" glowed className="mt-10 p-6 text-center">
        <p className="text-lg font-bold text-white">
          See your own before — free
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Get your real grade in under a minute, from your own in-game data.
        </p>
        <div className="mt-4">
          <MagicButton href="/report" variant="gold" size="lg">
            Score my account free
          </MagicButton>
        </div>
      </PremiumCard>
    </article>
  );
}
