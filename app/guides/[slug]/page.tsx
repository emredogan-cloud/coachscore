import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLdScript } from '@/components/seo/json-ld';
import { MagicButton, PremiumCard } from '@/components/ui';
import {
  articleJsonLd,
  breadcrumbJsonLd,
  buildMetadata,
  canonicalUrl,
  faqJsonLd,
  getSeoGuide,
  SEO_GUIDE_SLUGS,
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
  const jsonLd = [
    articleJsonLd({
      headline: guide.h1,
      description: guide.description,
      url,
    }),
    breadcrumbJsonLd([
      { name: 'Guides', url: canonicalUrl('/guides') },
      { name: guide.h1, url },
    ]),
    faqJsonLd(guide.faqs),
  ];

  return (
    <article className="mx-auto max-w-md px-4 py-10">
      <JsonLdScript data={jsonLd} />
      <nav className="text-sm text-[var(--muted)]">
        <Link href="/guides" className="hover:text-white">
          Guides
        </Link>{' '}
        / <span className="text-[var(--fg)]/80">{guide.h1}</span>
      </nav>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
        {guide.h1}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
        {guide.intro}
      </p>

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
    </article>
  );
}
