import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLdScript } from '@/components/seo/json-ld';
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
    <article className="mx-auto max-w-3xl px-4 py-12">
      <JsonLdScript data={jsonLd} />
      <nav className="text-sm text-gray-500">
        <Link href="/guides" className="hover:underline">
          Guides
        </Link>{' '}
        / {guide.h1}
      </nav>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{guide.h1}</h1>
      <p className="mt-3 text-gray-600 dark:text-gray-300">{guide.intro}</p>

      {guide.sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="text-xl font-semibold">{section.heading}</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {section.body}
          </p>
        </section>
      ))}

      <div className="mt-10 rounded-lg border border-black p-5 dark:border-white">
        <p className="font-medium">{guide.ctaText}</p>
        <Link
          href="/onboarding"
          className="mt-3 inline-block rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Score my account free
        </Link>
      </div>

      {guide.faqs.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">FAQ</h2>
          <dl className="mt-2 space-y-4">
            {guide.faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="font-medium">{faq.question}</dt>
                <dd className="mt-1 text-sm text-gray-600 dark:text-gray-300">
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
