/**
 * Types for the versioned Game-Data Reference Table.
 *
 * This table is the patch-robustness mechanism (TECH_DECISIONS.md): a new Town
 * Hall or a balance change is a DATA update + a version bump, never a code
 * change. The scoring engine reads TH-relative maxima from here.
 *
 * Anti-hallucination contract: any value not confirmed by an authoritative
 * source is marked `needsVerification: true` rather than guessed. The patch
 * watcher (scripts/validate-reference-table.ts) reports the verification debt;
 * verified values come from COACHSCORE_DEEP_DIVE_REPORT.md or the live game.
 */

export type HeroId =
  | 'barbarianKing'
  | 'archerQueen'
  | 'grandWarden'
  | 'royalChampion'
  | 'minionPrince'
  | 'dragonDuke';

export const ALL_HERO_IDS: readonly HeroId[] = [
  'barbarianKing',
  'archerQueen',
  'grandWarden',
  'royalChampion',
  'minionPrince',
  'dragonDuke',
] as const;

/** Max level + relative cost weight for one hero at one Town Hall. */
export interface HeroCap {
  /** Whether this hero is unlocked at this Town Hall. */
  readonly unlocked: boolean;
  /** Max attainable level at this Town Hall (0 when not unlocked). */
  readonly maxLevel: number;
  /**
   * Relative Dark-Elixir cost-to-max weight, used by the Hero sub-score so
   * expensive heroes (GW, RC) count more than cheap ones. A proxy for true DE
   * cost; exact values are flagged for verification.
   */
  readonly deCostWeight: number;
  /** True when maxLevel/weight are not yet confirmed against an authority. */
  readonly needsVerification: boolean;
}

/** Hero Equipment availability + caps. N/A below TH16 (deep-dive §7.2). */
export type EquipmentReference =
  | { readonly available: false }
  | {
      readonly available: true;
      /** Count of meta-relevant epic equipment pieces expected at this TH. */
      readonly keyEpicsTotal: number;
      /** Max level any single equipment piece can reach at this TH. */
      readonly maxLevel: number;
      readonly needsVerification: boolean;
    };

/**
 * Aggregate caps for a lab/building category. Full per-element tables (every
 * building, troop, spell, trap) are populated by the patch-watcher data task;
 * until then a category is structurally present but flagged for verification.
 */
export interface CategoryReference {
  /** Representative max level for elements in this category at this TH. */
  readonly representativeMaxLevel: number;
  readonly needsVerification: boolean;
  readonly note?: string;
}

export type CategoryId = 'offense' | 'defense' | 'walls';

export interface TownHallReference {
  readonly townHall: number;
  /** The previous Town Hall, used by the Progression / Rush sub-score. */
  readonly previousTownHall: number;
  readonly heroes: Readonly<Record<HeroId, HeroCap>>;
  readonly equipment: EquipmentReference;
  readonly categories: Readonly<Record<CategoryId, CategoryReference>>;
  /** True only when every field for this TH is verified. */
  readonly fullyVerified: boolean;
  readonly sourceNotes: string;
}

export interface GameDataReference {
  /** Semantic-ish version, bumped on every game patch. */
  readonly version: string;
  /** ISO date this table becomes effective. */
  readonly effectiveFrom: string;
  readonly gameVersionNote: string;
  readonly townHalls: Readonly<Record<number, TownHallReference>>;
}
