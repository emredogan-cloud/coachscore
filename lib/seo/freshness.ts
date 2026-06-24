/**
 * Content freshness tracking (SEO execution sprint · roadmap §7, §21).
 *
 * The moat is patch-driven freshness: programmatic guides are derived from the
 * Game-Data Reference Table, so a new Town Hall or balance change bumps the
 * table's `version`/`effectiveFrom`, which automatically advances every guide's
 * last-modified date and re-signals freshness to crawlers — competitors' static
 * posts go stale, CoachScore does not. This module is the single source of
 * truth for "when did this surface's content last change", consumed by the
 * sitemap (`lastModified`) and the on-page "Updated {date}" stamp.
 *
 * Dates are deterministic (no wall-clock reads), so builds are reproducible and
 * the sitemap is stable until content actually changes.
 */

import { GAME_DATA_REFERENCE } from '@/lib/game-data';
import type { SeoGuide } from './pages';

/**
 * Editorial revision date for the hand-authored marketing + EEAT surfaces
 * (home, pricing, about, methodology, …). Bump when those pages are revised.
 */
export const CONTENT_REVISION_DATE = '2026-06-24';

/** The reference-table patch date — when programmatic game-data last changed. */
export function gameDataEffectiveDate(): string {
  return GAME_DATA_REFERENCE.effectiveFrom;
}

/** The reference-table version, surfaced as a freshness/provenance signal. */
export function gameDataVersion(): string {
  return GAME_DATA_REFERENCE.version;
}

/**
 * Last-modified date (ISO `YYYY-MM-DD`) for a programmatic guide. All guides
 * derive from the reference table, so their freshness IS the table's patch
 * date — a patch bump re-dates them en masse, which is exactly the freshness
 * signal we want.
 */
export function guideLastModified(_guide: SeoGuide): string {
  return gameDataEffectiveDate();
}

/** Last-modified date for any path: guides follow the patch date, the rest the
 * editorial revision date. Used by the sitemap to stamp every entry. */
export function lastModifiedForPath(path: string): string {
  return path.startsWith('/guides/') && path !== '/guides'
    ? gameDataEffectiveDate()
    : CONTENT_REVISION_DATE;
}

/** A human "Updated {Month YYYY}" label for on-page freshness display. */
export function freshnessLabel(iso: string): string {
  const [year, month] = iso.split('-');
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const idx = Number(month) - 1;
  const name = months[idx] ?? '';
  return name ? `${name} ${year}` : iso;
}
