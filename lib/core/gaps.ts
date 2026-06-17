/**
 * Gap list (deep-dive §7.5): every current-TH element below its target,
 * ranked by priority = impact × under-completion ÷ cost — "maximize
 * goal-relevant improvement per unit of resource/time."
 *
 * Gaps are drawn from the current-Town-Hall upgrade targets (heroes, offense,
 * defense, equipment, walls). Progression is a diagnostic lens (vs. the
 * previous TH) and Clan Value is behavioral, so neither produces roadmap items
 * here — avoiding double-counting. The ranked list is the deterministic seed
 * the AI (Phase 2) renders into prose and a coach verifies.
 */

import { completion, equipmentScore, wallScore } from './subscores';
import type {
  GapItem,
  NormalizedAccount,
  SubScoreKey,
  WeightedElement,
} from './types';
import type { WeightProfile } from './weights';

/** Below this completion an element is considered "done" and not a gap. */
const COMPLETE_THRESHOLD = 1;
/** Floor on cost to keep the priority formula finite. */
const MIN_COST = 1e-6;

function makeGap(
  id: string,
  category: SubScoreKey,
  level: number,
  maxLevel: number,
  comp: number,
  cost: number,
  impact: number,
): GapItem {
  const underCompletion = Math.max(0, 1 - comp);
  const priority = (impact * underCompletion) / Math.max(cost, MIN_COST);
  return {
    id,
    category,
    level,
    maxLevel,
    completion: comp,
    underCompletion,
    impact,
    cost,
    priority,
  };
}

function elementGaps(
  elements: readonly WeightedElement[],
  category: SubScoreKey,
  impact: number,
): GapItem[] {
  const gaps: GapItem[] = [];
  for (const el of elements) {
    if (el.maxLevel <= 0) continue;
    const comp = completion(el.level, el.maxLevel);
    if (comp >= COMPLETE_THRESHOLD) continue;
    gaps.push(
      makeGap(el.id, category, el.level, el.maxLevel, comp, el.weight, impact),
    );
  }
  return gaps;
}

/**
 * Build the ranked gap list for an account under the active weight profile.
 * Sorted by priority descending; ties broken by larger under-completion, then
 * id, so the ordering is fully deterministic.
 */
export function buildGapList(
  account: NormalizedAccount,
  profile: WeightProfile,
): GapItem[] {
  const gaps: GapItem[] = [];

  // Heroes — cost = DE cost weight.
  for (const hero of account.heroes) {
    if (hero.maxLevel <= 0) continue;
    const comp = completion(hero.level, hero.maxLevel);
    if (comp >= COMPLETE_THRESHOLD) continue;
    gaps.push(
      makeGap(
        hero.id,
        'heroes',
        hero.level,
        hero.maxLevel,
        comp,
        hero.deCostWeight,
        profile.heroes,
      ),
    );
  }

  gaps.push(...elementGaps(account.offense, 'offense', profile.offense));
  gaps.push(...elementGaps(account.defense, 'defense', profile.defense));

  // Walls — a single aggregate gap (nominal unit cost).
  const wallFraction =
    account.walls.total > 0
      ? account.walls.atOrAboveThMax / account.walls.total
      : 1;
  if (wallScore(account.walls) < 100) {
    gaps.push(
      makeGap(
        'walls',
        'walls',
        account.walls.atOrAboveThMax,
        account.walls.total,
        Math.min(1, Math.max(0, wallFraction)),
        1,
        profile.walls,
      ),
    );
  }

  // Equipment — a single aggregate gap, only when in play (TH16+) and weighted.
  const eq = equipmentScore(account.equipment);
  if (eq !== null && eq < 100 && profile.equipment > 0) {
    gaps.push(
      makeGap(
        'equipment',
        'equipment',
        Math.round(eq),
        100,
        eq / 100,
        1,
        profile.equipment,
      ),
    );
  }

  gaps.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    if (b.underCompletion !== a.underCompletion) {
      return b.underCompletion - a.underCompletion;
    }
    return a.id.localeCompare(b.id);
  });

  return gaps;
}
