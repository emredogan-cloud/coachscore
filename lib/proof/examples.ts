/**
 * Illustrative transformation library (PROOF-P0). These are SYNTHETIC examples
 * built to show the format and the kind of improvement CoachScore guides — they
 * are NOT real accounts and carry no real outcomes. Every surface that renders
 * them MUST label them as illustrative (the project's honesty rule + consumer-
 * trust law; no fabricated reviews/ratings). When real, consented user data
 * exists post-launch, PROOF-P2 replaces these with genuine stories.
 */

export interface TransformationExample {
  readonly id: string;
  readonly title: string;
  readonly townHall: number;
  readonly goal: string;
  readonly before: { readonly grade: string; readonly overall: number };
  readonly after: { readonly grade: string; readonly overall: number };
  readonly days: number;
  readonly summary: string;
  readonly keyMoves: readonly string[];
}

/** Synthetic — illustrative format only, not real accounts. */
export const TRANSFORMATION_EXAMPLES: readonly TransformationExample[] = [
  {
    id: 'rushed-th15-derush',
    title: 'Rushed TH15 → caught up',
    townHall: 15,
    goal: 'derush',
    before: { grade: 'D', overall: 54 },
    after: { grade: 'B', overall: 76 },
    days: 30,
    summary:
      'A heavily-rushed base that jumped Town Halls early. The roadmap front-loaded the cheapest, highest-impact catch-up upgrades before anything cosmetic.',
    keyMoves: [
      'Finished two lagging key defenses to close the rush gap',
      'Brought the Royal Champion up to the TH cap (biggest grade gain per Dark Elixir)',
      'Levelled core attack troops before touching walls',
    ],
  },
  {
    id: 'war-th16-ready',
    title: 'TH16 made war-ready',
    townHall: 16,
    goal: 'war',
    before: { grade: 'C', overall: 66 },
    after: { grade: 'A', overall: 84 },
    days: 45,
    summary:
      'A solid base that was not pulling its weight in war. The war-weighted roadmap prioritised the heroes and army that actually win attacks.',
    keyMoves: [
      'Hero equipment deep-dive: levelled the two meta epics first',
      'Closed the Grand Warden gap (highest war impact for the cost)',
      'Topped up the offensive lab before defensive structures',
    ],
  },
  {
    id: 'recruit-th17',
    title: 'TH17 ready to get recruited',
    townHall: 17,
    goal: 'recruit',
    before: { grade: 'C', overall: 69 },
    after: { grade: 'A', overall: 81 },
    days: 21,
    summary:
      'A returning player who wanted to join a competitive clan. The roadmap focused on the signals recruiters actually check.',
    keyMoves: [
      'Maxed heroes to the TH cap (the first thing a recruiter looks at)',
      'Raised clan-contribution signals (donations + war stars)',
      'Finished the meta army before chasing trophies',
    ],
  },
];
