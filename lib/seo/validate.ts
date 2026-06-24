/**
 * SEO validation (SEO execution sprint · roadmap §21 "SEO validation agent").
 *
 * Pure validators that turn the SEO contract into machine-checkable rules:
 * unique metadata, non-thin programmatic content (roadmap §6.1), a connected
 * internal-link graph with no orphans, and full sitemap coverage. Run by
 * `scripts/validate-seo.ts` and asserted by `tests/seo`. Returns issues rather
 * than throwing so callers (CI vs. report) decide how to react.
 */

import { PRODUCT_SKUS } from '@/lib/products';
import { relatedGuides, inboundLinkCount } from './internal-links';
import { SEO_GUIDES, type SeoGuide } from './pages';
import { buildSitemap } from './sitemap';

export type IssueLevel = 'error' | 'warn';

export interface SeoIssue {
  readonly level: IssueLevel;
  readonly where: string;
  readonly message: string;
}

export interface SeoValidationResult {
  readonly ok: boolean;
  readonly errors: readonly SeoIssue[];
  readonly warnings: readonly SeoIssue[];
  readonly checked: {
    readonly guides: number;
    readonly sitemapEntries: number;
  };
}

const MIN_INTRO_CHARS = 120;
const MIN_BODY_CHARS = 600; // intro + section bodies combined
const MIN_SECTIONS = 2;
const MIN_FAQS = 1;
const MIN_DATA_POINTS = 3;

function guideBodyLength(guide: SeoGuide): number {
  return (
    guide.intro.length +
    guide.sections.reduce((sum, s) => sum + s.body.length, 0)
  );
}

/** Thin-content + uniqueness checks for the programmatic guide set (§6.1). */
export function validateGuides(
  guides: readonly SeoGuide[] = SEO_GUIDES,
): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const seenSlug = new Map<string, number>();
  const seenTitle = new Map<string, number>();
  const seenDesc = new Map<string, number>();
  const seenH1 = new Map<string, number>();
  const seenIntro = new Map<string, number>();

  const bump = (m: Map<string, number>, k: string): void =>
    void m.set(k, (m.get(k) ?? 0) + 1);

  for (const g of guides) {
    const at = `guide:${g.slug}`;
    bump(seenSlug, g.slug);
    bump(seenTitle, g.title);
    bump(seenDesc, g.description);
    bump(seenH1, g.h1);
    bump(seenIntro, g.intro);

    if (g.intro.length < MIN_INTRO_CHARS) {
      issues.push({
        level: 'error',
        where: at,
        message: `intro is ${g.intro.length} chars (min ${MIN_INTRO_CHARS}) — thin.`,
      });
    }
    if (guideBodyLength(g) < MIN_BODY_CHARS) {
      issues.push({
        level: 'error',
        where: at,
        message: `body is ${guideBodyLength(g)} chars (min ${MIN_BODY_CHARS}) — thin.`,
      });
    }
    if (g.sections.length < MIN_SECTIONS) {
      issues.push({
        level: 'error',
        where: at,
        message: `${g.sections.length} sections (min ${MIN_SECTIONS}).`,
      });
    }
    if (g.faqs.length < MIN_FAQS) {
      issues.push({
        level: 'error',
        where: at,
        message: `${g.faqs.length} FAQs (min ${MIN_FAQS}).`,
      });
    }
    if (g.dataPoints.length < MIN_DATA_POINTS) {
      issues.push({
        level: 'error',
        where: at,
        message: `${g.dataPoints.length} data points (min ${MIN_DATA_POINTS}) — missing unique real data.`,
      });
    }
    // §6.1: every guide must reference its Town Hall in FAQs (TH-specific) when
    // it is a per-TH guide.
    if (g.townHall !== null) {
      const refsTh = g.faqs.some((f) =>
        `${f.question} ${f.answer}`.includes(`TH${g.townHall}`),
      );
      if (!refsTh) {
        issues.push({
          level: 'warn',
          where: at,
          message: `FAQs do not reference TH${g.townHall} specifically.`,
        });
      }
    }
  }

  const dupes = (m: Map<string, number>, kind: string): void => {
    for (const [value, n] of m) {
      if (n > 1) {
        issues.push({
          level: 'error',
          where: 'guides',
          message: `duplicate ${kind} across ${n} guides: "${value.slice(0, 60)}…"`,
        });
      }
    }
  };
  dupes(seenSlug, 'slug');
  dupes(seenTitle, 'title');
  dupes(seenDesc, 'description');
  dupes(seenH1, 'h1');
  dupes(seenIntro, 'intro');

  return issues;
}

/** Internal-link graph: targets must exist, and no guide may be an orphan. */
export function validateInternalLinks(
  guides: readonly SeoGuide[] = SEO_GUIDES,
): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const slugs = new Set(guides.map((g) => `/guides/${g.slug}`));

  for (const g of guides) {
    const related = relatedGuides(g, guides);
    if (related.length === 0) {
      issues.push({
        level: 'error',
        where: `guide:${g.slug}`,
        message: 'has no outbound related links.',
      });
    }
    for (const link of related) {
      if (!slugs.has(link.href)) {
        issues.push({
          level: 'error',
          where: `guide:${g.slug}`,
          message: `links to non-existent guide ${link.href}.`,
        });
      }
    }
    if (inboundLinkCount(g, guides) === 0) {
      issues.push({
        level: 'error',
        where: `guide:${g.slug}`,
        message: 'is an orphan — no other guide links to it.',
      });
    }
  }
  return issues;
}

/** Sitemap must cover every indexable route exactly once with valid metadata. */
export function validateSitemap(
  baseUrl = 'https://coachscore.app',
): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const entries = buildSitemap(baseUrl);
  const urls = entries.map((e) => e.url);

  const seen = new Set<string>();
  for (const e of entries) {
    if (seen.has(e.url)) {
      issues.push({
        level: 'error',
        where: 'sitemap',
        message: `duplicate URL ${e.url}.`,
      });
    }
    seen.add(e.url);
    if (e.priority <= 0 || e.priority > 1) {
      issues.push({
        level: 'error',
        where: 'sitemap',
        message: `${e.url} priority ${e.priority} out of (0,1].`,
      });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.lastModified)) {
      issues.push({
        level: 'error',
        where: 'sitemap',
        message: `${e.url} lastModified "${e.lastModified}" is not an ISO date.`,
      });
    }
  }

  // Every guide + product SKU must be present.
  for (const g of SEO_GUIDES) {
    if (!urls.includes(`${baseUrl}/guides/${g.slug}`)) {
      issues.push({
        level: 'error',
        where: 'sitemap',
        message: `missing guide ${g.slug}.`,
      });
    }
  }
  for (const sku of PRODUCT_SKUS) {
    if (!urls.includes(`${baseUrl}/products/${sku}`)) {
      issues.push({
        level: 'error',
        where: 'sitemap',
        message: `missing product ${sku}.`,
      });
    }
  }
  return issues;
}

/** Run every validator and aggregate. */
export function runSeoValidation(): SeoValidationResult {
  const all = [
    ...validateGuides(),
    ...validateInternalLinks(),
    ...validateSitemap(),
  ];
  const errors = all.filter((i) => i.level === 'error');
  const warnings = all.filter((i) => i.level === 'warn');
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    checked: {
      guides: SEO_GUIDES.length,
      sitemapEntries: buildSitemap('https://coachscore.app').length,
    },
  };
}
