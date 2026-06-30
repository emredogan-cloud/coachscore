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
  title: 'Transparency & trust — data, pricing, refunds | CoachScore',
  description:
    'How CoachScore handles your data, prices its products, processes refunds ' +
    'and disputes, and stays compliant with Supercell fan-content policy.',
  path: '/transparency',
  type: 'article',
});

const SECTIONS: readonly { title: string; body: string }[] = [
  {
    title: 'Your data',
    body: 'A free score needs no account. We collect the minimum required to grade your account, ask for analytics consent before any non-essential tracking, and support data requests in line with GDPR/KVKK. We do not sell your data.',
  },
  {
    title: 'Pricing',
    body: 'Prices are shown up front with no hidden fees. The score and grade are free; the full prioritized roadmap and specialized tools (ReplayDoctor, BaseDoctor, WarPlan) are one-time purchases at the price listed on each page.',
  },
  {
    title: 'Refunds & disputes',
    body: 'If a paid report does not meet the quality we promise, we have a defined dispute and refund path. The grade is honest, not flattering — a low grade is still a correct result.',
  },
  {
    title: 'Honest data',
    body: 'Town Hall caps come from a versioned reference table. Verified values are sourced; best-effort values are flagged for verification rather than presented as fact. We never fabricate reviews or ratings.',
  },
  {
    title: 'Supercell compliance',
    body: 'CoachScore is unofficial and is not endorsed by Supercell. Clash of Clans is a trademark of Supercell. We use only public game data and follow fan-content guidelines.',
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

export default function TransparencyPage() {
  return (
    <article className="mx-auto max-w-md px-4 py-10">
      <JsonLdScript
        data={articleJsonLd({
          headline: 'CoachScore transparency & trust',
          description: metadata.description as string,
          url: canonicalUrl('/transparency'),
          dateModified: CONTENT_REVISION_DATE,
        })}
      />
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Transparency' }]}
      />

      <div className="mt-4">
        <EyebrowPill tone="violet">What you can check</EyebrowPill>
      </div>

      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
        Transparency &amp; <span className="text-violet-gradient">trust</span>
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
        The things you should be able to check before you trust a grade — or pay
        for a report. If anything here is unclear, that is a bug; tell us.
      </p>

      <SectionDivider className="mt-10">How we operate</SectionDivider>

      <div className="mt-7 space-y-3">
        {SECTIONS.map((s) => (
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
            title: 'Privacy first',
            subtitle: 'We do not sell your data',
          },
          {
            icon: shieldGlyph,
            title: 'Clear pricing',
            subtitle: 'No hidden fees',
          },
          {
            icon: shieldGlyph,
            title: 'Honest grade',
            subtitle: 'Correct, not flattering',
          },
          {
            icon: shieldGlyph,
            title: 'Unofficial & compliant',
            subtitle: 'Public game data only',
          },
        ]}
      />

      <PremiumCard tone="violet" className="mt-8 p-5">
        <p className="text-[15px] leading-relaxed text-[var(--muted)]">
          More detail in our{' '}
          <Link
            href="/editorial-standards"
            className="text-brand-violet-light hover:text-white"
          >
            editorial standards
          </Link>{' '}
          and{' '}
          <Link
            href="/methodology"
            className="text-brand-violet-light hover:text-white"
          >
            methodology
          </Link>
          .
        </p>
      </PremiumCard>

      <PremiumCard tone="gold" glowed className="mt-10 p-6 text-center">
        <p className="text-lg font-bold text-white">
          Check it for yourself — free
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Get your grade in under a minute, no account required.
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
