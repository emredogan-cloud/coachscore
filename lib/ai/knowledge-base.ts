/**
 * Curated meta knowledge base, injected at inference so advice reflects the
 * CURRENT game rather than the model's training data (ADR 0005). Kept small and
 * versioned; updated alongside the Game-Data Reference Table each patch.
 *
 * This is intentionally conservative, goal-agnostic guidance — the deterministic
 * engine supplies the account-specific numbers and the prioritized gap list;
 * the KB only supplies durable heuristics the model should respect.
 */

export const KNOWLEDGE_BASE_VERSION = '0.1.0-th18';

interface KnowledgeSlice {
  readonly minTownHall: number;
  readonly maxTownHall: number;
  readonly notes: readonly string[];
}

const SLICES: readonly KnowledgeSlice[] = [
  {
    minTownHall: 11,
    maxTownHall: 15,
    notes: [
      'Heroes are the single biggest offensive and defensive lever; prioritize the lowest-completion hero with the highest war impact.',
      'Max the specific meta-army troops you actually use before niche troops.',
      'Walls are generally the last resource sink to complete; defer them until heroes and army are done unless de-rushing.',
      'For war goals, the Grand Warden ability and Royal Champion are common bottlenecks for converting two-stars into three-stars.',
    ],
  },
  {
    minTownHall: 16,
    maxTownHall: 18,
    notes: [
      'Hero Equipment (TH16+) is often the highest-ROI investment and the least understood; unlocking the right meta epics matters before leveling them.',
      'Equipment and heroes together dominate offense; prioritize the equipment your meta army actually uses.',
      'Defenses matter more for trophy/legend pushing than for pure war optimization.',
      'Walls remain a late-stage sink; balance against heroes/equipment for the selected goal.',
    ],
  },
];

/** Return the KB text relevant to a Town Hall, as a single injected string. */
export function knowledgeBaseFor(townHall: number): string {
  const slice = SLICES.find(
    (s) => townHall >= s.minTownHall && townHall <= s.maxTownHall,
  );
  const notes = slice?.notes ?? [
    'Prioritize the highest-impact, lowest-completion upgrades for the selected goal.',
  ];
  return notes.map((n, i) => `${i + 1}. ${n}`).join('\n');
}
