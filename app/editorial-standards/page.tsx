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
  freshnessLabel,
} from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Editorial standards — how CoachScore content is made & verified',
  description:
    'How CoachScore drafts, dates and corrects its content: AI-drafted from ' +
    'our deterministic engine and a versioned reference table, with no ' +
    'fabricated reviews or ratings.',
  path: '/editorial-standards',
  type: 'article',
});

const STANDARDS: readonly { title: string; body: string }[] = [
  {
    title: 'AI-drafted, grounded in real data',
    body: 'Every roadmap and guide is drafted by AI grounded in our deterministic scoring engine and versioned reference data — never free-form opinion. The grade itself is computed, not written, so the same inputs always produce the same score.',
  },
  {
    title: 'Sourced, with honest uncertainty',
    body: 'Town Hall caps come from a versioned reference table. Verified values cite an authoritative source; best-effort values are explicitly flagged for verification. We never present an unverified number as certain.',
  },
  {
    title: 'No fabricated reviews or ratings',
    body: 'We do not invent testimonials, star ratings or aggregate review counts. Review and rating structured data is only ever emitted from real, collected data — until then it is absent.',
  },
  {
    title: 'Dated and kept fresh',
    body: 'Game-data content is tied to the reference-table version, so a Supercell patch re-dates and refreshes every affected page automatically. Each guide shows when its data was last updated.',
  },
  {
    title: 'Corrections',
    body: 'If a value is wrong, we fix the reference table — which corrects every page that uses it at once — and bump the data version. Accuracy beats speed.',
  },
];

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

export default function EditorialStandardsPage() {
  return (
    <article className="mx-auto max-w-md px-4 py-10">
      <JsonLdScript
        data={articleJsonLd({
          headline: 'CoachScore editorial standards',
          description: metadata.description as string,
          url: canonicalUrl('/editorial-standards'),
          dateModified: CONTENT_REVISION_DATE,
        })}
      />
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Editorial standards' }]}
      />

      <div className="mt-4">
        <EyebrowPill tone="violet">
          Updated {freshnessLabel(CONTENT_REVISION_DATE)}
        </EyebrowPill>
      </div>

      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
        Editorial <span className="text-violet-gradient">standards</span>
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
        These are the rules CoachScore content is held to. They exist so the
        advice you act on is accurate, honestly sourced, and current — the same
        bar we hold the paid roadmap to.
      </p>

      <SectionDivider className="mt-10">Our standards</SectionDivider>

      <div className="mt-7 space-y-3">
        {STANDARDS.map((s) => (
          <PremiumCard key={s.title} tone="plain" className="p-5">
            <h2 className="font-semibold text-white">{s.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
              {s.body}
            </p>
          </PremiumCard>
        ))}
      </div>

      <TrustBar
        className="mt-8"
        items={[
          {
            icon: shieldGlyph,
            title: 'Computed, not written',
            subtitle: 'The grade is deterministic',
          },
          {
            icon: shieldGlyph,
            title: 'Sourced caps',
            subtitle: 'Versioned reference table',
          },
          {
            icon: shieldGlyph,
            title: 'No fabrication',
            subtitle: 'No invented reviews',
          },
          {
            icon: shieldGlyph,
            title: 'Kept fresh',
            subtitle: 'Re-dated on every patch',
          },
        ]}
      />

      <PremiumCard tone="violet" className="mt-8 p-5">
        <p className="text-[15px] leading-relaxed text-[var(--muted)]">
          See the scoring detail on the{' '}
          <Link
            href="/methodology"
            className="text-brand-violet-light hover:text-white"
          >
            methodology page
          </Link>{' '}
          and our data handling on the{' '}
          <Link
            href="/transparency"
            className="text-brand-violet-light hover:text-white"
          >
            transparency page
          </Link>
          .
        </p>
      </PremiumCard>

      <PremiumCard tone="gold" glowed className="mt-10 p-6 text-center">
        <p className="text-lg font-bold text-white">
          Get your honest grade — free
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Held to the same bar as everything above.
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
