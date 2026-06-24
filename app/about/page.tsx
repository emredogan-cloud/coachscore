import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLdScript } from '@/components/seo/json-ld';
import { MagicButton } from '@/components/ui';
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
    'goal-aware upgrade roadmap — AI-drafted and verified by a real coach. ' +
    'Here is who we are and how it works.',
  path: '/about',
  type: 'article',
});

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
      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: 'About', href: '/about' },
        ]}
      />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
        About CoachScore
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
        CoachScore answers the question Clash of Clans players ask constantly —
        “rate my account” and “what should I upgrade next?” — with a real
        product instead of a forum thread. You get a grade across seven
        dimensions and a prioritized, goal-aware upgrade roadmap in under a
        minute.
      </p>

      <section className="mt-8">
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
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">How it works</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          A transparent, deterministic engine grades your account — the same
          inputs always produce the same score. AI then drafts a written
          roadmap, and a real coach verifies it before you act on it. That
          “AI-drafted, human-verified” model is the core of everything we ship.{' '}
          <Link
            href="/methodology"
            className="text-brand-violet-light hover:text-white"
          >
            Read the full methodology
          </Link>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">Built for mobile</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          CoachScore is a fast, installable web app (PWA) — no download, works
          on Android and iOS, and loads instantly. Your free score needs no
          account.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">
          Trust &amp; fair play
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          CoachScore is unofficial and is not endorsed by Supercell. Clash of
          Clans is a trademark of Supercell. We use only public game data, never
          fabricate reviews or ratings, and are honest about which reference
          values are verified. See our{' '}
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
      </section>

      <div className="mt-9">
        <MagicButton href="/onboarding" variant="gold" size="lg">
          Score your account free
        </MagicButton>
      </div>
    </article>
  );
}
