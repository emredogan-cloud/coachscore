import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLdScript } from '@/components/seo/json-ld';
import { MagicButton, PremiumCard } from '@/components/ui';
import {
  articleJsonLd,
  buildMetadata,
  canonicalUrl,
  faqJsonLd,
  freshnessLabel,
  gameDataVersion,
  getSeoGuide,
  guideLastModified,
  howToJsonLd,
  relatedGuides,
  SEO_GUIDE_SLUGS,
  type JsonLd,
} from '@/lib/seo';

export const dynamicParams = false;
// ISR (Phase 8): regenerate guides daily so evergreen content stays fresh
// without a rebuild, while serving cached static HTML for fast SEO TTFB.
export const revalidate = 86400;

export function generateStaticParams(): { slug: string }[] {
  return SEO_GUIDE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getSeoGuide(slug);
  if (guide === null) return { title: 'Not found — CoachScore' };
  return buildMetadata({
    title: guide.title,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    type: 'article',
  });
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getSeoGuide(slug);
  if (guide === null) notFound();

  const url = canonicalUrl(`/guides/${guide.slug}`);
  const updated = guideLastModified(guide);
  const related = relatedGuides(guide);

  const jsonLd: JsonLd[] = [
    articleJsonLd({
      headline: guide.h1,
      description: guide.description,
      url,
      dateModified: updated,
    }),
    faqJsonLd(guide.faqs),
  ];
  // HowTo only where the page genuinely describes an ordered procedure.
  if (guide.kind === 'rush_check') {
    jsonLd.push(
      howToJsonLd({
        name: 'How to de-rush a Clash of Clans account',
        description:
          'Catch up the cheapest high-impact gaps first to raise your grade.',
        steps: [
          {
            name: 'Catch up heroes',
            text: 'Level under-developed heroes for your current Town Hall first — the cheapest early levels close the biggest grade gap.',
          },
          {
            name: 'Catch up key defenses',
            text: 'Bring under-levelled key defenses up to the maxed baseline for your Town Hall.',
          },
          {
            name: 'Finish offense, then walls',
            text: 'Complete your main attack upgrades, then schedule walls last once everything else is in range.',
          },
        ],
      }),
    );
  }

  return (
    <article className="mx-auto max-w-md px-4 py-10">
      <JsonLdScript data={jsonLd} />
      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: 'Guides', href: '/guides' },
          { name: guide.h1, href: `/guides/${guide.slug}` },
        ]}
      />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
        {guide.h1}
      </h1>
      <p className="mt-1.5 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
        Updated {freshnessLabel(updated)} · data {gameDataVersion()}
      </p>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
        {guide.intro}
      </p>

      {guide.dataPoints.length > 0 ? (
        <PremiumCard tone="plain" className="mt-7 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-gold/80">
            {guide.townHall !== null
              ? `TH${guide.townHall} reference (max levels)`
              : 'At a glance'}
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {guide.dataPoints.map((dp) => (
              <div
                key={dp.label}
                className="flex items-baseline justify-between gap-2 border-b border-white/5 pb-1.5"
              >
                <dt className="text-[var(--muted)]">{dp.label}</dt>
                <dd className="text-right font-medium text-[var(--fg)]/90">
                  {dp.value}
                </dd>
              </div>
            ))}
          </dl>
        </PremiumCard>
      ) : null}

      {guide.sections.map((section) => (
        <section key={section.heading} className="mt-7">
          <h2 className="text-lg font-semibold text-white">
            {section.heading}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
            {section.body}
          </p>
        </section>
      ))}

      <PremiumCard tone="gold" glowed className="mt-9 p-5 text-center">
        <p className="font-medium text-white">{guide.ctaText}</p>
        <div className="mt-3">
          <MagicButton href="/onboarding" variant="gold">
            Score my account free
          </MagicButton>
        </div>
      </PremiumCard>

      {guide.faqs.length > 0 ? (
        <section className="mt-9">
          <h2 className="text-lg font-semibold text-white">FAQ</h2>
          <dl className="mt-3 space-y-4">
            {guide.faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="font-medium text-[var(--fg)]/90">
                  {faq.question}
                </dt>
                <dd className="mt-1 text-sm text-[var(--muted)]">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="mt-9" aria-labelledby="related-heading">
          <h2
            id="related-heading"
            className="text-xs font-semibold uppercase tracking-wider text-brand-violet-light"
          >
            Related guides
          </h2>
          <ul className="mt-3 space-y-2">
            {related.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-[var(--fg)]/90 transition hover:border-brand-violet/40 hover:text-white"
                >
                  {link.label}
                  <span aria-hidden className="text-brand-violet-light">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav className="mt-9 border-t border-white/10 pt-5 text-sm">
        <Link
          href="/methodology"
          className="text-brand-violet-light hover:text-white"
        >
          How CoachScore grades accounts →
        </Link>
      </nav>
    </article>
  );
}
