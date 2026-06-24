/**
 * Internal-link automation (SEO execution sprint · roadmap §12, §21).
 *
 * A deterministic related-guide engine: given a guide, it computes the
 * contextual links that wire the hub-and-spoke topical graph — adjacent Town
 * Halls, the same Town Hall's sibling guides (upgrade-order ↔ equipment), and
 * the free rush checker. New guides automatically gain correct inbound and
 * outbound links with no manual editing, which is the §21 "internal-link agent"
 * foundation. Pure functions over the guide set — no orphans by construction.
 */

import { SEO_GUIDES, type SeoGuide } from './pages';

export interface RelatedLink {
  readonly href: string;
  readonly label: string;
}

function bySlug(slug: string): SeoGuide | undefined {
  return SEO_GUIDES.find((g) => g.slug === slug);
}

function href(guide: SeoGuide): string {
  return `/guides/${guide.slug}`;
}

function upgradeOrderSlug(th: number): string {
  return `th${th}-upgrade-order-2026`;
}

function equipmentSlug(th: number): string {
  return `th${th}-hero-equipment-priority`;
}

/**
 * Contextual related links for a guide (3–5), in priority order. Always honest:
 * only links to guides that actually exist in the set.
 */
export function relatedGuides(
  guide: SeoGuide,
  all: readonly SeoGuide[] = SEO_GUIDES,
): RelatedLink[] {
  const exists = (slug: string): SeoGuide | undefined =>
    all.find((g) => g.slug === slug);
  const links: RelatedLink[] = [];
  const push = (g: SeoGuide | undefined, label: string): void => {
    if (g && g.slug !== guide.slug && !links.some((l) => l.href === href(g))) {
      links.push({ href: href(g), label });
    }
  };

  const th = guide.townHall;

  if (guide.kind === 'upgrade_order' && th !== null) {
    // Same-Town-Hall equipment sibling (TH16+).
    push(exists(equipmentSlug(th)), `Best TH${th} hero equipment priority`);
    // The Town Hall above (when ready to move up) and below (catching up).
    push(
      exists(upgradeOrderSlug(th + 1)),
      `TH${th + 1} upgrade order — when you're ready to move up`,
    );
    push(exists(upgradeOrderSlug(th - 1)), `TH${th - 1} upgrade order`);
    // The free rush checker is the conversion spoke every guide links to.
    push(
      exists('is-my-account-rushed'),
      'Is my account rushed? (free checker)',
    );
  } else if (guide.kind === 'equipment_priority' && th !== null) {
    push(exists(upgradeOrderSlug(th)), `TH${th} upgrade order (2026)`);
    push(
      exists(equipmentSlug(th + 1)),
      `Best TH${th + 1} hero equipment priority`,
    );
    push(
      exists(equipmentSlug(th - 1)),
      `Best TH${th - 1} hero equipment priority`,
    );
    push(
      exists('is-my-account-rushed'),
      'Is my account rushed? (free checker)',
    );
  } else if (guide.kind === 'rush_check') {
    // The rush hub links into the most-searched upgrade orders + equipment.
    for (const t of [13, 14, 15, 16]) {
      push(exists(upgradeOrderSlug(t)), `TH${t} upgrade order (2026)`);
    }
    push(exists(equipmentSlug(16)), 'Best TH16 hero equipment priority');
  }

  return links.slice(0, 5);
}

/**
 * Inbound link count for a guide across the whole set — used by orphan-page
 * validation (every indexable guide must be reachable from at least one other
 * guide, in addition to the `/guides` hub).
 */
export function inboundLinkCount(
  guide: SeoGuide,
  all: readonly SeoGuide[] = SEO_GUIDES,
): number {
  const target = `/guides/${guide.slug}`;
  let count = 0;
  for (const g of all) {
    if (g.slug === guide.slug) continue;
    if (relatedGuides(g, all).some((l) => l.href === target)) count += 1;
  }
  return count;
}

// Re-export so callers can resolve a guide for link rendering in one import.
export { bySlug };
