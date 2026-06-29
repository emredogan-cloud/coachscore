import type { Metadata } from 'next';
import Link from 'next/link';
import { GRADE_BANDS } from '@/lib/core/grade';
import { ReturnVisitTracker, TrackOnMount } from '@/components/analytics/track';
import { DemoScore } from '@/components/home/demo-score';
import { JsonLdScript } from '@/components/seo/json-ld';
import { HeroBanner, MagicButton, PremiumCard } from '@/components/ui';
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

const GRADE_COLOR: Record<string, string> = {
  S: '#f5d272',
  A: '#22c55e',
  B: '#84cc16',
  C: '#eab308',
  D: '#f97316',
  F: '#ef4444',
};

const PILLARS = [
  { label: 'Detailed analysis', d: 'M4 19V5m5 14V9m5 10V3m5 16v-8' },
  {
    label: 'Expert evaluation',
    d: 'M12 3l7 3v6c0 4-3 6-7 9-4-3-7-5-7-9V6l7-3z',
  },
  {
    label: 'Fair & accurate',
    d: 'M12 3v18M5 7l7-3 7 3M5 7l-2 6h4l-2-6zm14 0l-2 6h4l-2-6z',
  },
  {
    label: 'Improve & dominate',
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
        <MagicButton href="/pricing" variant="ghost" size="lg">
          See pricing
        </MagicButton>
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

      {/* How it works — answers "how does it work?" in 3 steps */}
      <section className="mt-10" aria-labelledby="how-heading">
        <h2
          id="how-heading"
          className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/80"
        >
          How it works
        </h2>
        <ol className="mt-4 space-y-2.5">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.title}>
              <PremiumCard tone="plain" className="flex items-start gap-3 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-gradient text-sm font-bold text-white shadow-glow-violet-sm">
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
        <p className="mt-3 text-center text-sm text-[var(--muted)]">
          You get a grade (F–S), the 7-dimension breakdown behind it, and a
          prioritized upgrade roadmap tuned to your goal.
        </p>
      </section>

      {/* Grade scale — shield cards */}
      <section className="mt-10" aria-labelledby="grades-heading">
        <h2
          id="grades-heading"
          className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/80"
        >
          The CoachScore grade scale
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {GRADE_BANDS.map((band) => {
            const color = GRADE_COLOR[band.grade] ?? '#a855f7';
            const featured = band.grade === 'S';
            return (
              <PremiumCard
                key={band.grade}
                tone={featured ? 'gold' : 'violet'}
                glowed={featured}
                className={`flex flex-col items-center justify-center py-4 ${
                  featured ? 'col-span-3 py-6' : ''
                }`}
              >
                <span
                  className={`font-extrabold leading-none ${featured ? 'text-5xl' : 'text-3xl'}`}
                  style={{ color, textShadow: `0 0 22px ${color}55` }}
                >
                  {band.grade}
                </span>
                <span className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
                  {band.min}
                  {band.max === 100 ? '+' : `–${band.max}`}
                </span>
              </PremiumCard>
            );
          })}
        </div>
        <p className="mt-3 text-center text-sm text-[var(--muted)]">
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

      {/* Value pillars */}
      <section
        className="mt-9 grid grid-cols-4 gap-2"
        aria-label="What you get"
      >
        {PILLARS.map((p) => (
          <div key={p.label} className="flex flex-col items-center text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
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
            <span className="mt-1.5 text-[10px] font-medium leading-tight text-[var(--muted)]">
              {p.label}
            </span>
          </div>
        ))}
      </section>

      {/* Popular guides — internal links (hub → spoke) */}
      <section className="mt-10" aria-labelledby="guides-heading">
        <h2
          id="guides-heading"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/80"
        >
          Popular free guides
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {POPULAR_GUIDES.map((g) => (
            <li key={g.href}>
              <Link
                href={g.href}
                className="block rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-[var(--fg)]/90 transition hover:border-brand-violet/40 hover:text-white"
              >
                {g.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          <Link
            href="/guides"
            className="text-brand-violet-light hover:text-white"
          >
            Browse all Clash of Clans upgrade guides →
          </Link>
        </p>
      </section>

      {/* Why trust it — EEAT */}
      <section className="mt-10" aria-labelledby="trust-heading">
        <h2
          id="trust-heading"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/80"
        >
          Why you can trust the grade
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
          CoachScore grades with a transparent, deterministic engine — the same
          inputs always produce the same score — and the AI-drafted roadmap is
          built only from your verified in-game data. Our scoring rubric and a
          full example report are public.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
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
      </section>

      {/* FAQ — branded / trust intent */}
      <section className="mt-10" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-lg font-semibold text-white">
          Frequently asked questions
        </h2>
        <dl className="mt-3 space-y-4">
          {HOME_FAQS.map((faq) => (
            <div key={faq.question}>
              <dt className="font-medium text-[var(--fg)]/90">
                {faq.question}
              </dt>
              <dd className="mt-1 text-sm text-[var(--muted)]">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
