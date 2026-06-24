import { describe, expect, it } from 'vitest';
import { PRODUCT_SKUS } from '@/lib/products';
import {
  articleJsonLd,
  breadcrumbJsonLd,
  buildMetadata,
  buildRobots,
  buildSitemap,
  canonicalUrl,
  CONTENT_REVISION_DATE,
  faqJsonLd,
  freshnessLabel,
  gameDataEffectiveDate,
  getSeoGuide,
  guidesByPillar,
  howToJsonLd,
  inboundLinkCount,
  lastModifiedForPath,
  organizationJsonLd,
  productJsonLd,
  relatedGuides,
  runSeoValidation,
  SEO_GUIDES,
  SEO_GUIDE_SLUGS,
  validateGuides,
  validateInternalLinks,
  webApplicationJsonLd,
  websiteJsonLd,
  type SeoGuide,
} from '@/lib/seo';

describe('metadata framework', () => {
  it('builds canonical + OG + twitter + hreflang metadata', () => {
    const meta = buildMetadata({
      title: 'T',
      description: 'D',
      path: '/guides/is-my-account-rushed',
    });
    expect(meta.alternates?.canonical).toBe(
      canonicalUrl('/guides/is-my-account-rushed'),
    );
    expect(meta.alternates?.languages).toMatchObject({
      en: canonicalUrl('/guides/is-my-account-rushed'),
      'x-default': canonicalUrl('/guides/is-my-account-rushed'),
    });
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
  it('builds Organization with optional logo + sameAs (no fabrication)', () => {
    const bare = organizationJsonLd('https://x.app');
    expect(bare['@type']).toBe('Organization');
    expect(bare.logo).toBeUndefined();
    expect(bare.sameAs).toBeUndefined();

    const full = organizationJsonLd('https://x.app', {
      logoUrl: 'https://x.app/icon.svg',
      sameAs: ['https://youtube.com/@x'],
    });
    expect(full.logo).toBe('https://x.app/icon.svg');
    expect(full.sameAs).toEqual(['https://youtube.com/@x']);

    // Empty sameAs must be omitted, not emitted as [].
    expect(
      organizationJsonLd('https://x.app', { sameAs: [] }).sameAs,
    ).toBeUndefined();
  });

  it('WebSite carries a SearchAction pointing at the real guides search', () => {
    const ld = websiteJsonLd('https://x.app') as {
      potentialAction: { target: { urlTemplate: string } };
    };
    expect(ld.potentialAction.target.urlTemplate).toBe(
      'https://x.app/guides?q={search_term_string}',
    );
  });

  it('Product + Offer uses real price and never fabricates ratings', () => {
    const ld = productJsonLd({
      name: 'ReplayDoctor',
      description: 'd',
      url: 'https://x.app/products/replay_doctor',
      priceUsd: 9,
    }) as { offers: Record<string, unknown> } & Record<string, unknown>;
    expect(ld['@type']).toBe('Product');
    expect(ld.offers.price).toBe('9.00');
    expect(ld.offers.priceCurrency).toBe('USD');
    expect(ld.offers.availability).toBe('https://schema.org/InStock');
    expect(ld.aggregateRating).toBeUndefined();
    expect(ld.review).toBeUndefined();
  });

  it('WebApplication advertises the free tool', () => {
    const ld = webApplicationJsonLd('https://x.app') as {
      offers: { price: string };
      applicationCategory: string;
    };
    expect(ld.offers.price).toBe('0');
    expect(ld.applicationCategory).toBe('GameApplication');
  });

  it('HowTo + FAQ + Breadcrumb + Article shapes are valid', () => {
    const how = howToJsonLd({
      name: 'n',
      description: 'd',
      steps: [{ name: 's', text: 't' }],
    }) as { step: { position: number }[] };
    expect(how.step[0]?.position).toBe(1);

    const faq = faqJsonLd([{ question: 'q', answer: 'a' }]) as {
      mainEntity: unknown[];
    };
    expect(faq.mainEntity).toHaveLength(1);

    const bc = breadcrumbJsonLd([{ name: 'n', url: 'u' }]) as {
      itemListElement: { position: number }[];
    };
    expect(bc.itemListElement[0]?.position).toBe(1);

    const art = articleJsonLd({
      headline: 'h',
      description: 'd',
      url: 'u',
      dateModified: '2026-06-17',
    }) as { dateModified: string };
    expect(art.dateModified).toBe('2026-06-17');
  });
});

describe('programmatic SEO guides — de-templated', () => {
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

  it('every guide carries unique real data, not a shared template', () => {
    // Unique slugs, titles, descriptions, h1, AND intros (no thin duplication).
    expect(new Set(SEO_GUIDE_SLUGS).size).toBe(SEO_GUIDES.length);
    for (const key of ['title', 'description', 'h1', 'intro'] as const) {
      const values = SEO_GUIDES.map((g) => g[key]);
      expect(new Set(values).size).toBe(values.length);
    }
    for (const guide of SEO_GUIDES) {
      expect(guide.sections.length).toBeGreaterThanOrEqual(2);
      expect(guide.intro.length).toBeGreaterThan(120);
      // Roadmap §6.1: each page must carry real reference data.
      expect(guide.dataPoints.length).toBeGreaterThanOrEqual(3);
      expect(guide.faqs.length).toBeGreaterThanOrEqual(1);
      // Per-TH guides must reference their Town Hall specifically.
      if (guide.townHall !== null) {
        const blob = guide.faqs
          .map((f) => `${f.question} ${f.answer}`)
          .join(' ');
        expect(blob).toContain(`TH${guide.townHall}`);
      }
    }
  });

  it('injects the real reference caps so TH13 ≠ TH14 content', () => {
    const th13 = getSeoGuide('th13-upgrade-order-2026');
    const th14 = getSeoGuide('th14-upgrade-order-2026');
    // RC unlocks at 13 → its cap (25 @ TH13, 30 @ TH14) appears in the data.
    expect(JSON.stringify(th13?.dataPoints)).toContain('Royal Champion');
    expect(th13?.intro).not.toBe(th14?.intro);
  });

  it('groups guides into pillars', () => {
    expect(guidesByPillar('rush').length).toBe(1);
    expect(guidesByPillar('upgrade-order').length).toBe(8);
    expect(guidesByPillar('equipment').length).toBe(3);
  });
});

describe('internal linking — hub & spoke, no orphans', () => {
  it('every guide has outbound related links to real targets', () => {
    const slugs = new Set(SEO_GUIDES.map((g) => `/guides/${g.slug}`));
    for (const guide of SEO_GUIDES) {
      const related = relatedGuides(guide);
      expect(related.length).toBeGreaterThan(0);
      for (const link of related) expect(slugs.has(link.href)).toBe(true);
    }
  });

  it('no guide is an orphan', () => {
    for (const guide of SEO_GUIDES) {
      expect(inboundLinkCount(guide)).toBeGreaterThan(0);
    }
  });
});

describe('freshness', () => {
  it('guides follow the patch date, other pages the editorial date', () => {
    expect(lastModifiedForPath('/guides/th14-upgrade-order-2026')).toBe(
      gameDataEffectiveDate(),
    );
    expect(lastModifiedForPath('/methodology')).toBe(CONTENT_REVISION_DATE);
    expect(lastModifiedForPath('/guides')).toBe(CONTENT_REVISION_DATE);
  });
});

describe('sitemap + robots', () => {
  it('covers core, EEAT, product, and guide pages with valid lastmod', () => {
    const entries = buildSitemap('https://coachscore.app');
    const urls = entries.map((e) => e.url);
    // Home URL matches the canonical (no trailing slash).
    expect(urls).toContain('https://coachscore.app');
    expect(urls).toContain('https://coachscore.app/methodology');
    expect(urls).toContain('https://coachscore.app/about');
    for (const sku of PRODUCT_SKUS) {
      expect(urls).toContain(`https://coachscore.app/products/${sku}`);
    }
    expect(urls).toContain(
      'https://coachscore.app/guides/th14-upgrade-order-2026',
    );
    for (const e of entries) {
      expect(e.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(e.priority).toBeGreaterThan(0);
      expect(e.priority).toBeLessThanOrEqual(1);
    }
    // No duplicate URLs.
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('tiers priority: home highest, long-tail equipment lowest', () => {
    const entries = buildSitemap('https://coachscore.app');
    const get = (suffix: string): number =>
      entries.find((e) => e.url.endsWith(suffix))?.priority ?? -1;
    expect(get('coachscore.app')).toBe(1);
    expect(get('/th16-hero-equipment-priority')).toBeLessThan(
      get('/is-my-account-rushed'),
    );
  });

  it('keeps API + ops surfaces out of the index', () => {
    const robots = buildRobots('https://coachscore.app');
    expect(robots.rules[0]?.disallow).toEqual(
      expect.arrayContaining(['/api/', '/admin']),
    );
    expect(robots.sitemap).toBe('https://coachscore.app/sitemap.xml');
  });
});

describe('full SEO contract', () => {
  it('passes validation: no thin content, no orphans, sitemap complete', () => {
    const result = runSeoValidation();
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });
});

describe('validators actually catch problems (not decorative)', () => {
  const thin: SeoGuide = {
    slug: 'thin',
    kind: 'upgrade_order',
    pillar: 'upgrade-order',
    townHall: 999,
    title: 'Thin',
    description: 'Thin',
    h1: 'Thin',
    intro: 'too short',
    sections: [],
    dataPoints: [],
    faqs: [],
    ctaText: 'x',
  };

  it('flags thin content (short intro/body, no sections/faqs/data)', () => {
    const issues = validateGuides([thin]);
    const msgs = issues.map((i) => i.message).join(' | ');
    expect(issues.some((i) => i.level === 'error')).toBe(true);
    expect(msgs).toContain('thin');
    expect(msgs).toMatch(/data points/);
  });

  it('flags a duplicate title across guides', () => {
    const dupe: SeoGuide = { ...thin, slug: 'thin-2' };
    const issues = validateGuides([thin, dupe]);
    expect(issues.some((i) => i.message.includes('duplicate title'))).toBe(
      true,
    );
  });

  it('flags an orphan guide with no inbound or outbound links', () => {
    const msgs = validateInternalLinks([thin])
      .map((i) => i.message)
      .join(' | ');
    expect(msgs).toContain('orphan');
    expect(msgs).toContain('no outbound');
  });
});

describe('freshnessLabel', () => {
  it('formats ISO dates as Month YYYY and passes through bad input', () => {
    expect(freshnessLabel('2026-06-17')).toBe('June 2026');
    expect(freshnessLabel('not-a-date')).toBe('not-a-date');
  });
});
