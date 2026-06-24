/**
 * Sitemap + robots generation (Phase 7). Pure builders the Next route handlers
 * (`app/sitemap.ts`, `app/robots.ts`) render. Includes the static marketing
 * surfaces, the product SKU pages, and every programmatic SEO guide.
 */

import { PRODUCT_SKUS } from '@/lib/products';
import { SEO_GUIDE_SLUGS } from './pages';

export type ChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

export interface SitemapEntry {
  readonly url: string;
  readonly changeFrequency: ChangeFrequency;
  readonly priority: number;
}

function join(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

export function buildSitemap(baseUrl: string): readonly SitemapEntry[] {
  const entries: SitemapEntry[] = [
    { url: join(baseUrl, '/'), changeFrequency: 'weekly', priority: 1 },
    {
      url: join(baseUrl, '/pricing'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: join(baseUrl, '/products'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    { url: join(baseUrl, '/guides'), changeFrequency: 'weekly', priority: 0.7 },
    {
      url: join(baseUrl, '/onboarding'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];
  for (const sku of PRODUCT_SKUS) {
    entries.push({
      url: join(baseUrl, `/products/${sku}`),
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }
  for (const slug of SEO_GUIDE_SLUGS) {
    entries.push({
      url: join(baseUrl, `/guides/${slug}`),
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }
  return entries;
}

export interface RobotsRule {
  readonly userAgent: string;
  readonly allow?: readonly string[];
  readonly disallow?: readonly string[];
}

export interface RobotsConfig {
  readonly rules: readonly RobotsRule[];
  readonly sitemap: string;
  readonly host: string;
}

/** Allow crawling of public pages; keep private/ops surfaces out of the index. */
export function buildRobots(baseUrl: string): RobotsConfig {
  const host = baseUrl.replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: ['/api/', '/admin', '/coach/dashboard', '/report'],
      },
    ],
    sitemap: `${host}/sitemap.xml`,
    host,
  };
}
