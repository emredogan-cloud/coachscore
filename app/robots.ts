import type { MetadataRoute } from 'next';
import { buildRobots, siteUrl } from '@/lib/seo';

/** robots.txt (Phase 7) — crawl public pages, keep API/ops surfaces out. */
export default function robots(): MetadataRoute.Robots {
  const config = buildRobots(siteUrl());
  return {
    rules: config.rules.map((rule) => ({
      userAgent: rule.userAgent,
      allow: rule.allow ? [...rule.allow] : undefined,
      disallow: rule.disallow ? [...rule.disallow] : undefined,
    })),
    sitemap: config.sitemap,
    host: config.host,
  };
}
