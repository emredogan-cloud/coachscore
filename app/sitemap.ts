import type { MetadataRoute } from 'next';
import { buildSitemap, siteUrl } from '@/lib/seo';

// ISR (Phase 8): regenerate the sitemap daily as programmatic pages evolve.
export const revalidate = 86400;

/** XML sitemap (Phase 7) — static surfaces + product pages + SEO guides. */
export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(siteUrl()).map((entry) => ({
    url: entry.url,
    lastModified: entry.lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
