/**
 * Structured data (Phase 7). JSON-LD builders rendered into
 * `<script type="application/ld+json">` for rich results. Pure — return plain
 * objects the page serializes.
 */

export type JsonLd = Record<string, unknown>;

export function organizationJsonLd(siteUrl: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CoachScore',
    url: siteUrl,
    description:
      'CoachScore rates Clash of Clans accounts and produces a prioritized, ' +
      'goal-aware upgrade roadmap.',
  };
}

export function websiteJsonLd(siteUrl: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CoachScore',
    url: siteUrl,
  };
}

export interface FaqEntry {
  readonly question: string;
  readonly answer: string;
}

export function faqJsonLd(faqs: readonly FaqEntry[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export interface BreadcrumbItem {
  readonly name: string;
  readonly url: string;
}

export function breadcrumbJsonLd(items: readonly BreadcrumbItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface ArticleInput {
  readonly headline: string;
  readonly description: string;
  readonly url: string;
}

export function articleJsonLd(input: ArticleInput): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    mainEntityOfPage: input.url,
    author: { '@type': 'Organization', name: 'CoachScore' },
    publisher: { '@type': 'Organization', name: 'CoachScore' },
  };
}
