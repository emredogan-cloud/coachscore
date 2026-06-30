/**
 * Meta version + hero-unlock data (Feature 1). The army meta is community/creator
 * knowledge (the "coaching" the product sells), not a fabricated game-data cap —
 * it's versioned + patch-aware and sourced in ARMY_META_REFERENCE.md. Bump
 * `META_VERSION` + `effectiveFrom` on each balance patch.
 */

import type { HeroId } from '@/lib/game-data';

export const META_VERSION = '0.1.0';
export const META_EFFECTIVE_FROM = '2026-06-30';
export const META_NOTE =
  'TH16–18 era (post-Dragon Duke). Community/creator meta — strategic ' +
  'recommendations, not official balance data. Confirm against the live meta ' +
  'each balance patch.';

/** Town Hall at which each hero first unlocks (verified, Fandom Hero Hall). */
export const HERO_UNLOCK_TH: Readonly<Record<HeroId, number>> = {
  barbarianKing: 7,
  archerQueen: 8,
  minionPrince: 9,
  grandWarden: 11,
  royalChampion: 13,
  dragonDuke: 15,
};
