import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { JsonLdScript } from '@/components/seo/json-ld';
import {
  Breadcrumbs,
  EyebrowPill,
  MagicButton,
  PremiumCard,
  SectionDivider,
  TrustBar,
} from '@/components/ui';
import {
  articleJsonLd,
  buildMetadata,
  canonicalUrl,
  CONTENT_REVISION_DATE,
} from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'About CoachScore — Clash of Clans account rating & coaching',
  description:
    'CoachScore rates Clash of Clans accounts and produces a prioritized, ' +
    'goal-aware upgrade roadmap — AI-drafted from your real in-game data. ' +
    'Here is who we are and how it works.',
  path: '/about',
  type: 'article',
});

// Abstract, IP-safe SVG glyph (no game art) reused for trust rows.
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

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-md px-4 py-10">
      <JsonLdScript
        data={articleJsonLd({
          headline: 'About CoachScore',
          description: metadata.description as string,
          url: canonicalUrl('/about'),
          dateModified: CONTENT_REVISION_DATE,
        })}
      />
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'About' }]} />

      <div className="mt-4">
        <EyebrowPill tone="violet">Rate my account · what next</EyebrowPill>
      </div>

      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
        About <span className="text-violet-gradient">CoachScore</span>
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
        CoachScore answers the question Clash of Clans players ask constantly —
        “rate my account” and “what should I upgrade next?” — with a real
        product instead of a forum thread. You get a grade across seven
        dimensions and a prioritized, goal-aware upgrade roadmap in under a
        minute.
      </p>

      <SectionDivider className="mt-10">What you get</SectionDivider>

      <div className="mt-7 space-y-5">
        <PremiumCard tone="violet" className="p-5">
          <h2 className="text-lg font-semibold text-white">
            The problem we solve
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
            Trackers tell you how long an upgrade takes; wikis list every level;
            Reddit gives you ten conflicting opinions. None of them tell{' '}
            <em>you</em>, for <em>your</em> account and <em>your</em> goal, what
            to do next. CoachScore turns scattered data into a single judgement
            and an ordered plan.
          </p>
        </PremiumCard>

        <PremiumCard tone="violet" className="p-5">
          <h2 className="text-lg font-semibold text-white">How it works</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
            A transparent, deterministic engine grades your account — the same
            inputs always produce the same score. AI then drafts a written
            roadmap from your real in-game numbers, so every recommendation is
            grounded in your account rather than generic advice.{' '}
            <Link
              href="/methodology"
              className="text-brand-violet-light hover:text-white"
            >
              Read the full methodology
            </Link>
            .
          </p>
        </PremiumCard>

        <PremiumCard tone="violet" className="p-5">
          <h2 className="text-lg font-semibold text-white">Built for mobile</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
            CoachScore is a fast, installable web app (PWA) — no download, works
            on Android and iOS, and loads instantly. Your free score needs no
            account.
          </p>
        </PremiumCard>

        <PremiumCard tone="gold" className="p-5">
          <h2 className="text-lg font-semibold text-white">
            Trust &amp; fair play
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
            CoachScore is unofficial and is not endorsed by Supercell. Clash of
            Clans is a trademark of Supercell. We use only public game data,
            never fabricate reviews or ratings, and are honest about which
            reference values are verified. See our{' '}
            <Link
              href="/transparency"
              className="text-brand-violet-light hover:text-white"
            >
              transparency
            </Link>{' '}
            and{' '}
            <Link
              href="/editorial-standards"
              className="text-brand-violet-light hover:text-white"
            >
              editorial standards
            </Link>{' '}
            pages.
          </p>
        </PremiumCard>
      </div>

      <TrustBar
        className="mt-8"
        items={[
          {
            icon: shieldGlyph,
            title: 'Deterministic',
            subtitle: 'Same inputs, same score',
          },
          {
            icon: shieldGlyph,
            title: 'Public data only',
            subtitle: 'Your real in-game numbers',
          },
          {
            icon: shieldGlyph,
            title: 'No fabrication',
            subtitle: 'No fake reviews or ratings',
          },
          {
            icon: shieldGlyph,
            title: 'Free to start',
            subtitle: 'No account required',
          },
        ]}
      />

      <PremiumCard tone="gold" glowed className="mt-10 p-6 text-center">
        <p className="text-lg font-bold text-white">Rate your account — free</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          A grade and a plan in under a minute, from your own in-game data.
        </p>
        <div className="mt-4">
          <MagicButton href="/report" variant="gold" size="lg">
            Score your account free
          </MagicButton>
        </div>
      </PremiumCard>
    </article>
  );
}
