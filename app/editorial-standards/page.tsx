import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLdScript } from '@/components/seo/json-ld';
import { MagicButton, PremiumCard } from '@/components/ui';
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
    'How CoachScore drafts, verifies, dates and corrects its content: ' +
    'AI-drafted, human-verified, sourced from a versioned reference table, with ' +
    'no fabricated reviews or ratings.',
  path: '/editorial-standards',
  type: 'article',
});

const STANDARDS: readonly { title: string; body: string }[] = [
  {
    title: 'AI-drafted, human-verified',
    body: 'Every roadmap and guide is drafted by AI grounded in our scoring engine and reference data, then reviewed by a person before publication. The deterministic grade itself is computed, not written.',
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
        items={[
          { name: 'Home', href: '/' },
          { name: 'Editorial standards', href: '/editorial-standards' },
        ]}
      />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
        Editorial standards
      </h1>
      <p className="mt-1.5 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
        Updated {freshnessLabel(CONTENT_REVISION_DATE)}
      </p>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
        These are the rules CoachScore content is held to. They exist so the
        advice you act on is accurate, honestly sourced, and current — the same
        bar we hold the paid roadmap to.
      </p>

      <div className="mt-7 space-y-3">
        {STANDARDS.map((s) => (
          <PremiumCard key={s.title} tone="plain" className="p-4">
            <h2 className="font-semibold text-white">{s.title}</h2>
            <p className="mt-1.5 text-sm text-[var(--muted)]">{s.body}</p>
          </PremiumCard>
        ))}
      </div>

      <p className="mt-7 text-[15px] leading-relaxed text-[var(--muted)]">
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

      <div className="mt-9">
        <MagicButton href="/onboarding" variant="gold" size="lg">
          Score your account free
        </MagicButton>
      </div>
    </article>
  );
}
