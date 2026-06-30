import type { Metadata } from 'next';
import Link from 'next/link';
import { GRADE_BANDS } from '@/lib/core/grade';
import { ReturnVisitTracker, TrackOnMount } from '@/components/analytics/track';
import { DemoScore } from '@/components/home/demo-score';
import { FadeUp, StaggerGroup } from '@/components/motion';
import { JsonLdScript } from '@/components/seo/json-ld';
import {
  EyebrowPill,
  GradeBadge,
  HeroBanner,
  MagicButton,
  PremiumCard,
  SectionDivider,
  TrustBar,
} from '@/components/ui';
import { buildMetadata, faqJsonLd, type FaqEntry } from '@/lib/seo';

/**
 * Landing page — premium "battle" theme + SEO-optimized (roadmap §9.5, §11,
 * §12, §18). Keyword H1, crawlable value + EEAT copy, contextual internal links
 * (the hub → spoke authority flow), a branded-intent FAQ, and the free-tool CTA.
 * Server-rendered, mobile-first. Organization + WebSite JSON-LD come from the
 * root layout; here we add WebApplication (the free tool) + FAQPage.
 */

export const metadata: Metadata = buildMetadata({
  title: 'CoachScore — Rate My Clash of Clans Account & Upgrade Roadmap',
  description:
    'Paste your player tag and get an objective Clash of Clans account score ' +
    'and a prioritized, goal-aware upgrade roadmap in seconds. Free instant ' +
    'score, no account needed.',
  path: '/',
});

/** Presentation-only labels for the on-site grade scale (derived from the
 *  authoritative GRADE_BANDS in lib/core — copy only, never the data). */
const GRADE_LABEL: Record<string, string> = {
  S: 'Elite',
  A: 'Excellent',
  B: 'Good progress',
  C: 'Solid base',
  D: 'Needs work',
  F: 'Rushed',
};

/** Border tint per grade for the scale cards (matches GradeBadge bands). */
const GRADE_RING: Record<string, string> = {
  S: 'border-brand-gold/45',
  A: 'border-grade-a/40',
  B: 'border-grade-b/40',
  C: 'border-grade-c/40',
  D: 'border-grade-d/40',
  F: 'border-grade-f/40',
};

const PILLARS: readonly { title: string; desc: string; d: string }[] = [
  {
    title: 'Detailed analysis',
    desc: 'Seven dimensions — heroes, offense, defense, equipment, progression, walls and clan value — scored from your real numbers.',
    d: 'M4 19V5m5 14V9m5 10V3m5 16v-8',
  },
  {
    title: 'Objective evaluation',
    desc: 'A transparent, deterministic engine. The same inputs always produce the same score — no opinions, no guesswork.',
    d: 'M12 3l7 3v6c0 4-3 6-7 9-4-3-7-5-7-9V6l7-3z',
  },
  {
    title: 'Fair & accurate',
    desc: 'Graded against a maxed, war-ready base for your exact Town Hall — so TH13 is never judged like TH17.',
    d: 'M12 3v18M5 7l7-3 7 3M5 7l-2 6h4l-2-6zm14 0l-2 6h4l-2-6z',
  },
  {
    title: 'Improve & dominate',
    desc: 'A prioritized, cost-weighted upgrade roadmap tuned to your goal — so you always know exactly what to build next.',
    d: 'M3 21l6-6m12-12l-6 6M9 9l6 6m-9 3l-3-3 3-3',
  },
];

const POPULAR_GUIDES: readonly { href: string; label: string }[] = [
  { href: '/guides/is-my-account-rushed', label: 'Is my account rushed?' },
  { href: '/guides/th17-upgrade-order-2026', label: 'TH17 upgrade order' },
  { href: '/guides/th16-upgrade-order-2026', label: 'TH16 upgrade order' },
  {
    href: '/guides/th16-hero-equipment-priority',
    label: 'Best TH16 hero equipment',
  },
];

const HOW_IT_WORKS: readonly { title: string; detail: string }[] = [
  {
    title: 'Paste your player tag',
    detail:
      'Enter your in-game player tag — we read your account automatically. No login, no account needed.',
  },
  {
    title: 'Get scored instantly',
    detail:
      'A transparent, deterministic engine grades seven dimensions for the goal you pick.',
  },
  {
    title: 'Get your roadmap',
    detail:
      'A prioritized, cost-weighted upgrade plan, built from your real in-game numbers.',
  },
];

const HOME_FAQS: readonly FaqEntry[] = [
  {
    question: 'Is CoachScore free?',
    answer:
      'Yes — you can score your Clash of Clans account and see your grade for free, with no account required. The full prioritized upgrade roadmap is paid.',
  },
  {
    question: 'What does CoachScore do?',
    answer:
      'It rates your account across seven dimensions (heroes, offense, defense, equipment, progression/rush, walls, and clan value) and gives you a prioritized, goal-aware upgrade roadmap, built from your real in-game data by a transparent, deterministic engine.',
  },
  {
    question: 'Which Town Halls are supported?',
    answer:
      'CoachScore covers Town Halls 11 through 18, the current late-game range, with per-Town-Hall upgrade guides and a free rush checker.',
  },
  {
    question: 'Is CoachScore affiliated with Supercell?',
    answer:
      'No. CoachScore is unofficial and is not endorsed by Supercell. Clash of Clans is a trademark of Supercell.',
  },
];

const TRUST_BAR_ITEMS = [
  {
    title: 'Official API',
    subtitle: 'Read from your real account',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3l7 3v6c0 4-3 6-7 9-4-3-7-5-7-9V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Deterministic',
    subtitle: 'Same inputs, same score',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" />
        <path d="M18 3v3.5h-3.5M6 21v-3.5h3.5" />
      </svg>
    ),
  },
  {
    title: 'Public methodology',
    subtitle: 'Nothing hidden',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    title: 'TH16–18 verified',
    subtitle: 'Late-game reference data',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L12 3z" />
      </svg>
    ),
  },
];

/** Tiny chevron used between the numbered how-it-works steps. */
function StepArrow() {
  return (
    <span aria-hidden className="my-1 flex justify-center text-brand-gold/50">
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14M19 12l-7 7-7-7" />
      </svg>
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="relative mx-auto max-w-md px-4 py-10">
      {/* Generated dark-aura backdrop behind the hero (2.7KB webp, masked to
          fade out so body text keeps AA contrast). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] bg-[url('/assets/generated/hero-aura-bg.webp')] bg-cover bg-top opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />
      <JsonLdScript data={faqJsonLd(HOME_FAQS)} />
      <TrackOnMount event="landing_viewed" />
      <ReturnVisitTracker />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <FadeUp className="flex justify-center">
        <EyebrowPill tone="gold">Free · Objective · Instant</EyebrowPill>
      </FadeUp>

      <HeroBanner
        crest
        headline="Is your Clash of Clans account actually good — or secretly rushed?"
        tagline="Free, objective account rating"
      />

      <p className="mt-6 text-center text-[15px] leading-relaxed text-[var(--muted)]">
        Stop guessing what to upgrade next. Paste your player tag and get your
        account scored —{' '}
        <span className="text-white">
          objective, instant, built from your real in-game data.
        </span>
      </p>

      {/* FP-2 — show the value in motion before any click */}
      <div className="mt-8 flex justify-center">
        <DemoScore />
      </div>

      {/* CTA — primary conversion path into the free score */}
      <div className="mt-8 space-y-3">
        <MagicButton href="/report" variant="gold" size="lg">
          Analyze my account
        </MagicButton>
        <div className="flex gap-3">
          <MagicButton href="/war" variant="ghost" className="flex-1">
            War readiness
          </MagicButton>
          <MagicButton href="/pricing" variant="ghost" className="flex-1">
            See pricing
          </MagicButton>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-[var(--muted)]">
        Free instant score · no account required · objective, from your in-game
        data.
      </p>

      {/* FP-4 — real trust signals (replacing the removed "human-verified" claim) */}
      <ul
        className="mt-5 flex flex-wrap justify-center gap-2"
        aria-label="Why you can trust the grade"
      >
        {[
          'Read from the official API',
          'Transparent, deterministic engine',
          'Public methodology',
          'TH16–18 verified',
        ].map((signal) => (
          <li
            key={signal}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-[var(--fg)]/80"
          >
            {signal}
          </li>
        ))}
      </ul>

      {/* ── Why CoachScore ──────────────────────────────────────────────── */}
      <section className="mt-12" aria-labelledby="why-heading">
        <h2 id="why-heading" className="sr-only">
          Why CoachScore
        </h2>
        <SectionDivider>Why CoachScore</SectionDivider>
        <StaggerGroup className="mt-5 grid grid-cols-2 gap-2.5">
          {PILLARS.map((p) => (
            <PremiumCard
              key={p.title}
              tone="violet"
              className="flex h-full flex-col p-5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-violet/15 ring-1 ring-brand-violet/30">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-brand-violet-light"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={p.d} />
                </svg>
              </span>
              <h3 className="mt-3 text-sm font-bold text-white">{p.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted)]">
                {p.desc}
              </p>
            </PremiumCard>
          ))}
        </StaggerGroup>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="mt-12" aria-labelledby="how-heading">
        <h2 id="how-heading" className="sr-only">
          How it works
        </h2>
        <SectionDivider>How it works</SectionDivider>
        <ol className="mt-5">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.title}>
              {i > 0 ? <StepArrow /> : null}
              <PremiumCard tone="plain" className="flex items-start gap-3 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-gradient text-sm font-extrabold text-ink-950 shadow-glow-gold-sm">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-white">{step.title}</h3>
                  <p className="mt-0.5 text-sm text-[var(--muted)]">
                    {step.detail}
                  </p>
                </div>
              </PremiumCard>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          You get a grade (F–S), the 7-dimension breakdown behind it, and a
          prioritized upgrade roadmap tuned to your goal.
        </p>
      </section>

      {/* ── Grade scale ─────────────────────────────────────────────────── */}
      <section className="mt-12" aria-labelledby="grades-heading">
        <h2 id="grades-heading" className="sr-only">
          The CoachScore grade scale
        </h2>
        <SectionDivider>The CoachScore grade scale</SectionDivider>

        {GRADE_BANDS.filter((b) => b.grade === 'S').map((band) => (
          <FadeUp key={band.grade} className="mt-5">
            <PremiumCard
              tone="gold"
              glowed
              className="flex items-center gap-4 p-5"
            >
              <GradeBadge grade="S" size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-gold">
                  {band.min}+ Elite
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                  A maxed, war-ready base for its Town Hall — the ceiling every
                  account is measured against.
                </p>
              </div>
            </PremiumCard>
          </FadeUp>
        ))}

        <div className="mt-2.5 grid grid-cols-3 gap-2.5">
          {GRADE_BANDS.filter((b) => b.grade !== 'S').map((band) => (
            <PremiumCard
              key={band.grade}
              tone="plain"
              className={`flex flex-col items-center justify-center gap-1.5 border ${
                GRADE_RING[band.grade] ?? 'border-white/8'
              } py-4`}
            >
              <GradeBadge grade={band.grade} size="sm" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
                {band.min}
                {band.max === 100 ? '+' : `–${band.max}`}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--fg)]/70">
                {GRADE_LABEL[band.grade] ?? ''}
              </span>
            </PremiumCard>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          Every account gets a grade from F to S based on how close it is to a
          maxed, war-ready base for its Town Hall.{' '}
          <Link
            href="/methodology"
            className="text-brand-violet-light hover:text-white"
          >
            See how scoring works
          </Link>
          .
        </p>
      </section>

      {/* ── Popular guides — internal links (hub → spoke) ───────────────── */}
      <section className="mt-12" aria-labelledby="guides-heading">
        <h2 id="guides-heading" className="sr-only">
          Popular free guides
        </h2>
        <SectionDivider>Popular free guides</SectionDivider>
        <ul className="mt-5 grid grid-cols-2 gap-2.5">
          {POPULAR_GUIDES.map((g) => (
            <li key={g.href}>
              <Link href={g.href} className="block h-full">
                <PremiumCard
                  tone="violet"
                  className="flex h-full items-center px-3.5 py-3 text-sm text-[var(--fg)]/90 transition hover:text-white hover:shadow-glow-violet-sm"
                >
                  {g.label}
                </PremiumCard>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-sm">
          <Link
            href="/guides"
            className="text-brand-violet-light hover:text-white"
          >
            Browse all Clash of Clans upgrade guides →
          </Link>
        </p>
      </section>

      {/* ── Why trust it — EEAT ─────────────────────────────────────────── */}
      <section className="mt-12" aria-labelledby="trust-heading">
        <h2 id="trust-heading" className="sr-only">
          Why you can trust the grade
        </h2>
        <SectionDivider>Why you can trust the grade</SectionDivider>
        <PremiumCard tone="plain" className="mt-5 p-5">
          <p className="text-[15px] leading-relaxed text-[var(--muted)]">
            CoachScore grades with a transparent, deterministic engine — the
            same inputs always produce the same score — and the AI-drafted
            roadmap is built only from your verified in-game data. Our scoring
            rubric and a full example report are public.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <Link
              href="/methodology"
              className="text-brand-violet-light hover:text-white"
            >
              Methodology
            </Link>
            <Link
              href="/sample-report"
              className="text-brand-violet-light hover:text-white"
            >
              Sample report
            </Link>
            <Link
              href="/examples"
              className="text-brand-violet-light hover:text-white"
            >
              Example transformations
            </Link>
            <Link
              href="/editorial-standards"
              className="text-brand-violet-light hover:text-white"
            >
              Editorial standards
            </Link>
            <Link
              href="/about"
              className="text-brand-violet-light hover:text-white"
            >
              About
            </Link>
          </div>
        </PremiumCard>
      </section>

      {/* ── FAQ — branded / trust intent ────────────────────────────────── */}
      <section className="mt-12" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="sr-only">
          Frequently asked questions
        </h2>
        <SectionDivider>Frequently asked questions</SectionDivider>
        <dl className="mt-5 space-y-2.5">
          {HOME_FAQS.map((faq) => (
            <PremiumCard key={faq.question} tone="plain" className="p-4">
              <dt className="font-semibold text-white">{faq.question}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                {faq.answer}
              </dd>
            </PremiumCard>
          ))}
        </dl>
      </section>

      {/* ── Trust bar ───────────────────────────────────────────────────── */}
      <TrustBar className="mt-12" items={TRUST_BAR_ITEMS} />
    </div>
  );
}
