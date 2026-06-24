/**
 * Structured data (Phase 7 · expanded in the SEO execution sprint). JSON-LD
 * builders rendered into `<script type="application/ld+json">` for rich
 * results. Pure — return plain objects the page serializes.
 *
 * Honesty rules (roadmap §11): schema only reflects content actually on the
 * page. We never emit Review/AggregateRating (no real ratings yet) and never
 * fabricate social profiles — `sameAs` is empty unless real profile URLs are
 * supplied via env. Offers use the real catalog prices.
 */

export type JsonLd = Record<string, unknown>;

const ORG_NAME = 'CoachScore';
const ORG_DESCRIPTION =
  'CoachScore rates Clash of Clans accounts and produces a prioritized, ' +
  'goal-aware upgrade roadmap — AI-drafted, human-verified.';

export interface OrganizationOptions {
  /** Absolute logo URL (e.g. `${siteUrl}/icon.svg`). */
  readonly logoUrl?: string;
  /** Real, verified social/profile URLs only — never fabricated. */
  readonly sameAs?: readonly string[];
}

export function organizationJsonLd(
  siteUrl: string,
  opts: OrganizationOptions = {},
): JsonLd {
  const ld: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: ORG_NAME,
    url: siteUrl,
    description: ORG_DESCRIPTION,
  };
  if (opts.logoUrl) ld.logo = opts.logoUrl;
  if (opts.sameAs && opts.sameAs.length > 0) ld.sameAs = [...opts.sameAs];
  return ld;
}

export function websiteJsonLd(siteUrl: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: ORG_NAME,
    url: siteUrl,
    // Sitelinks searchbox — targets the real, working guides search (?q=).
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/guides?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * WebApplication schema for the free account-rating tool — the key
 * differentiator (roadmap §11). The free teaser is genuinely free (price 0).
 */
export function webApplicationJsonLd(siteUrl: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: ORG_NAME,
    url: `${siteUrl}/onboarding`,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web (PWA), iOS, Android',
    description:
      'Free Clash of Clans account rating: get a scored grade across seven ' +
      'dimensions and a prioritized, goal-aware upgrade roadmap.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
}

export interface ProductOfferInput {
  readonly name: string;
  readonly description: string;
  readonly url: string;
  /** Price in whole/decimal USD (e.g. 9 for $9.00). */
  readonly priceUsd: number;
  readonly availability?: 'InStock' | 'PreOrder';
}

/**
 * Product + nested Offer. No Review/AggregateRating — we have no real ratings
 * yet and fabricating them is forbidden (roadmap §11).
 */
export function productJsonLd(input: ProductOfferInput): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    url: input.url,
    brand: { '@type': 'Brand', name: ORG_NAME },
    offers: {
      '@type': 'Offer',
      price: input.priceUsd.toFixed(2),
      priceCurrency: 'USD',
      availability: `https://schema.org/${input.availability ?? 'InStock'}`,
      url: input.url,
    },
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

export interface HowToStep {
  readonly name: string;
  readonly text: string;
}

export function howToJsonLd(input: {
  readonly name: string;
  readonly description: string;
  readonly steps: readonly HowToStep[];
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: input.name,
    description: input.description,
    step: input.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export interface ArticleInput {
  readonly headline: string;
  readonly description: string;
  readonly url: string;
  /** ISO date the article was last revised — strengthens the freshness signal. */
  readonly dateModified?: string;
  readonly datePublished?: string;
}

export function articleJsonLd(input: ArticleInput): JsonLd {
  const ld: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    mainEntityOfPage: input.url,
    author: { '@type': 'Organization', name: ORG_NAME },
    publisher: { '@type': 'Organization', name: ORG_NAME },
  };
  if (input.datePublished) ld.datePublished = input.datePublished;
  if (input.dateModified) ld.dateModified = input.dateModified;
  return ld;
}
