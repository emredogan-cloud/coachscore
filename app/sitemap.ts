import type { MetadataRoute } from 'next';
import { buildSitemap, siteUrl } from '@/lib/seo';

/** XML sitemap (Phase 7) — static surfaces + product pages + SEO guides. */
export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(siteUrl()).map((entry) => ({
    url: entry.url,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
