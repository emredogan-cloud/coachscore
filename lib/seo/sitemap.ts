/**
 * Sitemap + robots generation (Phase 7 · enterprise upgrade in the SEO sprint).
 * Pure builders the Next route handlers (`app/sitemap.ts`, `app/robots.ts`)
 * render. Covers the marketing surfaces, the EEAT trust pages, the product SKU
 * pages, and every programmatic SEO guide — each entry carries a real
 * `lastModified` (patch date for guides, editorial date for the rest) and a
 * tiered `priority` (hubs/pillars high, long-tail low) per roadmap §6.3/§9.7.
 */

import { PRODUCT_SKUS } from '@/lib/products';
import { lastModifiedForPath } from './freshness';
import { SEO_GUIDES } from './pages';

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
  readonly lastModified: string;
  readonly changeFrequency: ChangeFrequency;
  readonly priority: number;
}

interface PathEntry {
  readonly path: string;
  readonly changeFrequency: ChangeFrequency;
  readonly priority: number;
}

function join(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, '');
  return path === '/' ? base || '/' : `${base}${path}`;
}

/** Static marketing + EEAT surfaces, with tiered priorities. */
const STATIC_PATHS: readonly PathEntry[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/guides', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/methodology', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/pricing', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/products', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/onboarding', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/sample-report', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/editorial-standards', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/transparency', changeFrequency: 'monthly', priority: 0.5 },
];

/** Long-tail priority by guide kind: the rush pillar ranks above per-TH pages. */
function guidePriority(kind: string): number {
  if (kind === 'rush_check') return 0.7;
  if (kind === 'upgrade_order') return 0.6;
  return 0.5; // equipment_priority
}

export function buildSitemap(baseUrl: string): readonly SitemapEntry[] {
  const paths: PathEntry[] = [...STATIC_PATHS];

  for (const sku of PRODUCT_SKUS) {
    paths.push({
      path: `/products/${sku}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }
  for (const guide of SEO_GUIDES) {
    paths.push({
      path: `/guides/${guide.slug}`,
      changeFrequency: 'monthly',
      priority: guidePriority(guide.kind),
    });
  }

  return paths.map((p) => ({
    url: join(baseUrl, p.path),
    lastModified: lastModifiedForPath(p.path),
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
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
