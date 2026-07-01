import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { dimensionIcon } from '@/components/report/dimension-icons';
import { Disclaimer } from '@/components/disclaimer';
import { JsonLdScript } from '@/components/seo/json-ld';
import { ShareButtons } from '@/components/share/share-buttons';
import {
  Breadcrumbs,
  DimensionBar,
  EyebrowPill,
  GradeBadge,
  MagicButton,
  PremiumCard,
  ScoreRing,
  SectionDivider,
  TrustBar,
} from '@/components/ui';
import {
  articleJsonLd,
  breadcrumbJsonLd,
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

// Abstract, IP-safe SVG glyphs (no game art) for the dimension rows.
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

// Strongest / weakest dimensions, derived from the same illustrative numbers
// (presentation only — no scoring logic). `reduce` keeps the result non-nullable
// for the type checker (the array is a non-empty literal).
const strongest = SAMPLE.dimensions.reduce((a, b) => (b.pct > a.pct ? b : a));
const weakest = SAMPLE.dimensions.reduce((a, b) => (b.pct < a.pct ? b : a));

export default function SampleReportPage() {
  return (
    <article className="mx-auto max-w-md px-4 py-10">
      <JsonLdScript
        data={[
          articleJsonLd({
            headline: 'Sample CoachScore report',
            description: metadata.description as string,
            url: canonicalUrl('/sample-report'),
            dateModified: CONTENT_REVISION_DATE,
          }),
          breadcrumbJsonLd([
            { name: 'Home', url: canonicalUrl('/') },
            { name: 'Sample report', url: canonicalUrl('/sample-report') },
          ]),
        ]}
      />

      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Sample report' }]}
      />

      {/* Fortress hero crest */}
      <div className="relative mt-4 flex justify-center" aria-hidden>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(50%_50%_at_50%_45%,rgba(168,85,247,0.22),transparent_70%)]" />
        <Image
          src="/assets/generated/hero-fortress.webp"
          alt=""
          width={168}
          height={168}
          priority
          className="h-auto w-36 drop-shadow-[0_10px_34px_rgba(168,85,247,0.32)]"
        />
      </div>

      <div className="mt-4 flex justify-center">
        <EyebrowPill tone="violet">
          Illustrative example — not a real account
        </EyebrowPill>
      </div>

      <h1 className="mt-3 text-center text-3xl font-extrabold tracking-tight text-white">
        A sample <span className="text-violet-gradient">CoachScore</span> report
      </h1>
      <p className="mt-3 text-center text-[15px] leading-relaxed text-[var(--muted)]">
        This is what a finished report looks like: a single grade, the dimension
        breakdown behind it, and a prioritized roadmap. The numbers below are
        made up to show the format.
      </p>

      {/* Hero result card */}
      <PremiumCard tone="gold" glowed className="mt-7 animate-score-reveal p-6">
        <div className="flex items-start gap-4">
          <GradeBadge grade={SAMPLE.grade} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-gold/80">
              Town Hall {SAMPLE.townHall} · war goal
            </p>
            <p className="mt-1 text-2xl font-extrabold text-white">
              Grade {SAMPLE.grade}
            </p>
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              <span className="font-semibold text-gold-gradient">
                {SAMPLE.score}
              </span>
              /100 — solid, with a clear path to A.
            </p>
          </div>
          <ScoreRing
            value={SAMPLE.score}
            grade={SAMPLE.grade}
            size={104}
            label="Overall"
          />
        </div>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-xl border border-grade-a/30 bg-grade-a/10 px-3.5 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-grade-a">
              Your strongest dimension
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              {strongest.label} {strongest.pct}%
            </p>
          </div>
          <div className="rounded-xl border border-brand-gold/30 bg-brand-gold/10 px-3.5 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-gold-light">
              Your biggest opportunity
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              {weakest.label} {weakest.pct}%
            </p>
          </div>
        </div>
      </PremiumCard>

      {/* Two-column: breakdown + roadmap */}
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <PremiumCard tone="violet" className="p-5">
          <SectionDivider className="mb-4">Dimension breakdown</SectionDivider>
          <div className="space-y-3.5">
            {SAMPLE.dimensions.map((d) => (
              <DimensionBar
                key={d.label}
                label={d.label}
                percent={d.pct}
                icon={dimensionIcon(d.label)}
              />
            ))}
          </div>
        </PremiumCard>

        <PremiumCard tone="plain" className="p-5">
          <SectionDivider className="mb-4">Prioritized roadmap</SectionDivider>
          <ol className="space-y-3">
            {SAMPLE.roadmap.map((rec, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-gradient text-[11px] font-extrabold text-ink-950 shadow-glow-gold-sm">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-[var(--fg)]/90">
                  {rec}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-xl border-l-2 border-brand-violet-light/60 bg-brand-violet/10 px-3.5 py-2.5">
            <p className="text-xs leading-relaxed text-brand-violet-light">
              Each step is ordered by grade gained per resource spent — do them
              top to bottom for the fastest climb.
            </p>
          </div>
        </PremiumCard>
      </div>

      {/* CTA banner */}
      <PremiumCard tone="gold" glowed className="mt-9 p-6 text-center">
        <div className="relative mx-auto mb-3 flex justify-center" aria-hidden>
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(55%_55%_at_50%_50%,rgba(232,179,57,0.28),transparent_70%)]" />
          <Image
            src="/assets/generated/art-treasure.webp"
            alt=""
            width={116}
            height={116}
            className="h-auto w-24 drop-shadow-[0_8px_26px_rgba(232,179,57,0.4)]"
          />
        </div>
        <p className="text-lg font-bold text-white">
          Get your real grade — free
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          In under a minute, from your own in-game data.
        </p>
        <div className="mt-4">
          <MagicButton href="/report" variant="gold" size="lg">
            Score my account free
          </MagicButton>
        </div>
      </PremiumCard>

      {/* Share */}
      <section className="mt-10" aria-labelledby="share-heading">
        <h2 id="share-heading" className="sr-only">
          Share your result
        </h2>
        <SectionDivider>Share your result</SectionDivider>
        <p className="mt-3 text-center text-sm text-[var(--muted)]">
          One tap to share — or copy for Discord and clan chats.
        </p>
        <div className="mt-4">
          <ShareButtons
            url={canonicalUrl('/sample-report')}
            text={`I scored Grade ${SAMPLE.grade} (${SAMPLE.score}/100) on CoachScore — rate your Clash of Clans account free:`}
            imageUrl="/api/share/og"
          />
        </div>
      </section>

      {/* Trust bar */}
      <TrustBar
        className="mt-10"
        items={[
          {
            icon: shieldGlyph,
            title: '100% Transparent',
            subtitle: 'Deterministic engine',
          },
          {
            icon: shieldGlyph,
            title: 'Official API',
            subtitle: 'Your real in-game data',
          },
          {
            icon: shieldGlyph,
            title: 'Privacy first',
            subtitle: 'No login stored',
          },
          {
            icon: shieldGlyph,
            title: 'Built by players',
            subtitle: 'For players',
          },
        ]}
      />

      <p className="mt-8 text-center text-sm text-[var(--muted)]">
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
