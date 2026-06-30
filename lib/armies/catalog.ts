/**
 * Meta army catalog (Feature 1). Community/creator strategic meta for the TH16–18
 * era — the "coaching" knowledge players pay for, NOT fabricated game balance
 * data. Each army carries the Town Hall it becomes viable at, the goals it fits,
 * and the development it needs (hero completion vs TH caps + lab level), so the
 * engine only ever recommends armies a player can actually field. Versioned;
 * sources in ARMY_META_REFERENCE.md.
 */

import type { HeroId } from '@/lib/game-data';
import type { WarGoal } from '@/lib/war/types';

export type ArmyTier = 'S' | 'A' | 'B' | 'C';

export interface Army {
  readonly id: string;
  readonly name: string;
  readonly minTownHall: number;
  readonly goals: readonly WarGoal[];
  readonly tier: ArmyTier;
  /** Hero completion (0..1 of this TH's caps) the army leans on. */
  readonly minHeroCompletion: number;
  /** Lab/army development (0..100) the army needs to work. */
  readonly minLabPct: number;
  /** Heroes whose under-leveling is called out by name. */
  readonly keyHeroes: readonly HeroId[];
  readonly why: string;
}

export const ARMY_CATALOG: readonly Army[] = [
  {
    id: 'mass-dragons',
    name: 'Mass Dragons',
    minTownHall: 9,
    goals: ['war', 'farming', 'trophy'],
    tier: 'C',
    minHeroCompletion: 0.4,
    minLabPct: 60,
    keyHeroes: [],
    why: 'The classic beginner air army — forgiving, low hero dependence. Dragons + Lightning to open air defenses.',
  },
  {
    id: 'lavaloon',
    name: 'LavaLoon',
    minTownHall: 11,
    goals: ['war', 'cwl', 'trophy'],
    tier: 'B',
    minHeroCompletion: 0.6,
    minLabPct: 75,
    keyHeroes: ['grandWarden'],
    why: 'Lava Hounds soak while Balloons clear — a timeless air attack once your Balloons and Warden are leveled.',
  },
  {
    id: 'electro-dragon',
    name: 'Electro Dragons',
    minTownHall: 13,
    goals: ['war', 'cwl', 'trophy'],
    tier: 'B',
    minHeroCompletion: 0.55,
    minLabPct: 80,
    keyHeroes: ['grandWarden'],
    why: 'Electro Dragons + zaps to open air defenses — high value with a leveled lab and a low skill floor.',
  },
  {
    id: 'super-hog',
    name: 'Super Hog Rider spam',
    minTownHall: 13,
    goals: ['trophy', 'farming', 'war'],
    tier: 'B',
    minHeroCompletion: 0.6,
    minLabPct: 78,
    keyHeroes: ['royalChampion'],
    why: 'Fast, repeatable Super Hog spam — strong for trophies and farming once hogs are leveled.',
  },
  {
    id: 'yeti-smash',
    name: 'Yeti Smash',
    minTownHall: 13,
    goals: ['war', 'cwl'],
    tier: 'B',
    minHeroCompletion: 0.7,
    minLabPct: 80,
    keyHeroes: ['grandWarden', 'royalChampion'],
    why: 'Yetis + a Warden walk punch a lane open — needs a solid Warden and leveled Yetis.',
  },
  {
    id: 'queen-charge-hybrid',
    name: 'Queen Charge Hybrid',
    minTownHall: 14,
    goals: ['war', 'cwl'],
    tier: 'S',
    minHeroCompletion: 0.85,
    minLabPct: 85,
    keyHeroes: ['archerQueen', 'grandWarden', 'royalChampion'],
    why: 'A Queen Charge into a Hog/Miner hybrid — the highest-ceiling three-star attack. Needs near-maxed heroes.',
  },
  {
    id: 'super-archer-blimp',
    name: 'Super Archer Blimp',
    minTownHall: 14,
    goals: ['war', 'cwl'],
    tier: 'A',
    minHeroCompletion: 0.8,
    minLabPct: 82,
    keyHeroes: ['grandWarden', 'royalChampion'],
    why: 'A blimp drops Super Archers on the core — precise and hero-dependent.',
  },
  {
    id: 'root-rider-smash',
    name: 'Root Rider Smash',
    minTownHall: 15,
    goals: ['war', 'cwl', 'trophy'],
    tier: 'S',
    minHeroCompletion: 0.8,
    minLabPct: 82,
    keyHeroes: ['grandWarden', 'royalChampion'],
    why: 'Root Riders + a Warden walk — the dominant spam attack at TH15–16. Strong heroes carry it.',
  },
  {
    id: 'hydra',
    name: 'Hydra (Dragons + Electro)',
    minTownHall: 15,
    goals: ['war', 'cwl'],
    tier: 'S',
    minHeroCompletion: 0.75,
    minLabPct: 85,
    keyHeroes: ['grandWarden'],
    why: 'Dragons + Electro Dragons for heavy air pressure — needs a leveled air lab.',
  },
  {
    id: 'electro-titan-smash',
    name: 'Electro Titan Smash',
    minTownHall: 16,
    goals: ['war', 'cwl'],
    tier: 'A',
    minHeroCompletion: 0.8,
    minLabPct: 85,
    keyHeroes: ['grandWarden', 'royalChampion'],
    why: 'Electro Titans + a Warden walk — a heavy ground smash for TH16+.',
  },
];

export function getArmy(id: string): Army | null {
  return ARMY_CATALOG.find((a) => a.id === id) ?? null;
}
