import { describe, expect, it } from 'vitest';
import {
  breadcrumbJsonLd,
  buildMetadata,
  buildRobots,
  buildSitemap,
  canonicalUrl,
  faqJsonLd,
  getSeoGuide,
  organizationJsonLd,
  SEO_GUIDES,
  SEO_GUIDE_SLUGS,
} from '@/lib/seo';

describe('metadata framework', () => {
  it('builds canonical + OG + twitter metadata', () => {
    const meta = buildMetadata({
      title: 'T',
      description: 'D',
      path: '/guides/is-my-account-rushed',
    });
    expect(meta.alternates?.canonical).toBe(
      canonicalUrl('/guides/is-my-account-rushed'),
    );
    expect(meta.openGraph?.url).toContain('/guides/is-my-account-rushed');
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image' });
    expect(meta.robots).toMatchObject({ index: true, follow: true });
  });

  it('marks noindex pages', () => {
    expect(
      buildMetadata({ title: 'T', description: 'D', path: '/x', noindex: true })
        .robots,
    ).toMatchObject({ index: false });
  });
});

describe('structured data', () => {
  it('builds valid JSON-LD shapes', () => {
    expect(organizationJsonLd('https://x.app')['@type']).toBe('Organization');
    const faq = faqJsonLd([{ question: 'q', answer: 'a' }]) as {
      mainEntity: unknown[];
    };
    expect(faq.mainEntity).toHaveLength(1);
    const bc = breadcrumbJsonLd([{ name: 'n', url: 'u' }]) as {
      itemListElement: { position: number }[];
    };
    expect(bc.itemListElement[0]?.position).toBe(1);
  });
});

describe('programmatic SEO guides', () => {
  it('generates a rush checker + per-TH upgrade orders (11–18)', () => {
    expect(getSeoGuide('is-my-account-rushed')).not.toBeNull();
    for (let th = 11; th <= 18; th++) {
      expect(getSeoGuide(`th${th}-upgrade-order-2026`)).not.toBeNull();
    }
  });

  it('only generates equipment guides for TH16+', () => {
    expect(getSeoGuide('th16-hero-equipment-priority')).not.toBeNull();
    expect(getSeoGuide('th15-hero-equipment-priority')).toBeNull();
  });

  it('has unique slugs and substantive content (not thin)', () => {
    expect(new Set(SEO_GUIDE_SLUGS).size).toBe(SEO_GUIDES.length);
    for (const guide of SEO_GUIDES) {
      expect(guide.sections.length).toBeGreaterThanOrEqual(2);
      expect(guide.intro.length).toBeGreaterThan(80);
    }
  });
});

describe('sitemap + robots', () => {
  it('includes core pages, product pages, and guides', () => {
    const entries = buildSitemap('https://coachscore.app');
    const urls = entries.map((e) => e.url);
    expect(urls).toContain('https://coachscore.app/');
    expect(urls).toContain('https://coachscore.app/products/replay_doctor');
    expect(
      urls.some((u) => u.includes('/guides/th14-upgrade-order-2026')),
    ).toBe(true);
  });

  it('keeps API + ops surfaces out of the index', () => {
    const robots = buildRobots('https://coachscore.app');
    expect(robots.rules[0]?.disallow).toEqual(
      expect.arrayContaining(['/api/', '/admin']),
    );
    expect(robots.sitemap).toBe('https://coachscore.app/sitemap.xml');
  });
});
