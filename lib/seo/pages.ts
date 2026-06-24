/**
 * Programmatic SEO pages (Phase 7 · de-templated in the SEO execution sprint).
 *
 * Per-Town-Hall evergreen guides generated from the REAL reference table
 * (`lib/game-data`) rather than templated prose. Each guide injects that Town
 * Hall's actual hero caps, the heroes that newly unlock there, equipment status,
 * and category levels — so TH13 and TH14 are materially different pages with
 * unique intros, data, recommendations, and FAQs. This clears Google's
 * scaled-content bar (roadmap §6.1): every page carries (1) the free-checker
 * tool CTA, (2) real reference data, (3) a Town-Hall-specific emphasis, (4)
 * patch-dated freshness (see `freshness.ts`), and (5) FAQs that reference this
 * Town Hall's real numbers.
 *
 * Content is the CoachScore methodology + the VERIFIED-RANGE game data only
 * (TH11–18, the reference table's coverage). We never fabricate caps for Town
 * Halls outside that range (ADR-0004 anti-hallucination contract): extending to
 * TH3–10 is a reference-table data-entry task, not a content task.
 */

import {
  getTownHallReference,
  heroIdsUnlockedAt,
  MAX_TOWN_HALL,
  MIN_TOWN_HALL,
} from '@/lib/game-data';
import type { HeroId } from '@/lib/game-data';

export type SeoGuideKind =
  | 'upgrade_order'
  | 'rush_check'
  | 'equipment_priority';

/** Topical-authority pillar a guide belongs to (roadmap §5 hub-and-spoke). */
export type SeoPillar =
  | 'account-rating'
  | 'upgrade-order'
  | 'rush'
  | 'equipment';

export interface SeoSection {
  readonly heading: string;
  readonly body: string;
}

/** A real, per-page reference datum (unique-content component, roadmap §6.1). */
export interface SeoDataPoint {
  readonly label: string;
  readonly value: string;
}

export interface SeoFaq {
  readonly question: string;
  readonly answer: string;
}

export interface SeoGuide {
  readonly slug: string;
  readonly kind: SeoGuideKind;
  readonly pillar: SeoPillar;
  readonly townHall: number | null;
  readonly title: string;
  readonly description: string;
  readonly h1: string;
  readonly intro: string;
  readonly sections: readonly SeoSection[];
  /** Real reference-table data shown as a small table — unique per Town Hall. */
  readonly dataPoints: readonly SeoDataPoint[];
  readonly faqs: readonly SeoFaq[];
  readonly ctaText: string;
}

const EQUIPMENT_MIN_TH = 16;
const CTA = 'Get your free CoachScore in under a minute — no account required.';

const HERO_NAMES: Readonly<Record<HeroId, string>> = {
  barbarianKing: 'Barbarian King',
  archerQueen: 'Archer Queen',
  grandWarden: 'Grand Warden',
  royalChampion: 'Royal Champion',
  minionPrince: 'Minion Prince',
  dragonDuke: 'Dragon Duke',
};

const DIMENSIONS =
  'CoachScore grades seven dimensions — Heroes, Offense, Defense, Equipment, ' +
  'Progression (rush), Walls, and Clan value — and orders the roadmap by ' +
  'cost-weighted impact toward the goal you pick.';

function townHalls(): number[] {
  const out: number[] = [];
  for (let th = MIN_TOWN_HALL; th <= MAX_TOWN_HALL; th++) out.push(th);
  return out;
}

function listNames(ids: readonly HeroId[]): string {
  const names = ids.map((id) => HERO_NAMES[id]);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0] as string;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** Heroes that first become available at this Town Hall (vs. the previous one). */
function newlyUnlockedHeroes(th: number): HeroId[] {
  const here = heroIdsUnlockedAt(th);
  if (th <= MIN_TOWN_HALL) return here; // no previous row inside the table
  const prev = new Set(heroIdsUnlockedAt(th - 1));
  return here.filter((id) => !prev.has(id));
}

function heroCapText(th: number): string {
  const ref = getTownHallReference(th);
  return heroIdsUnlockedAt(th)
    .map((id) => `${HERO_NAMES[id]} ${ref.heroes[id].maxLevel}`)
    .join(', ');
}

function upgradeOrderDataPoints(th: number): SeoDataPoint[] {
  const ref = getTownHallReference(th);
  const points: SeoDataPoint[] = heroIdsUnlockedAt(th).map((id) => ({
    label: HERO_NAMES[id],
    value: `max level ${ref.heroes[id].maxLevel}`,
  }));
  points.push(
    {
      label: 'Walls',
      value: `max level ${ref.categories.walls.representativeMaxLevel}`,
    },
    {
      label: 'Key defenses',
      value: `around level ${ref.categories.defense.representativeMaxLevel}`,
    },
    {
      label: 'Lab / offense',
      value: `around level ${ref.categories.offense.representativeMaxLevel}`,
    },
  );
  if (ref.equipment.available) {
    points.push({
      label: 'Hero equipment',
      value: `${ref.equipment.keyEpicsTotal} key epics, max level ${ref.equipment.maxLevel}`,
    });
  }
  return points;
}

function upgradeOrderIntro(th: number): string {
  const ref = getTownHallReference(th);
  const fresh = newlyUnlockedHeroes(th);
  const isTop = th === MAX_TOWN_HALL;
  const parts: string[] = [
    `Sitting at Town Hall ${th} and not sure what to upgrade next? `,
  ];
  if (fresh.length > 0 && th > MIN_TOWN_HALL) {
    parts.push(
      `TH${th} unlocks the ${listNames(fresh)}, which reshuffles your priorities — a brand-new hero is usually the biggest single grade gap on the account. `,
    );
  } else if (th === MIN_TOWN_HALL) {
    parts.push(
      `TH${th} is the start of the late game, where hero levels and a real attack strategy begin to decide wars. `,
    );
  } else if (!isTop && !ref.equipment.available) {
    parts.push(
      `TH${th} does not add a new hero, so it is a consolidation Town Hall: the win is pushing your existing heroes (${heroCapText(th)}) toward their new caps before you move up. `,
    );
  }
  if (th === EQUIPMENT_MIN_TH) {
    parts.push(
      `TH${th} is also where hero equipment first becomes a scored dimension, so it now competes with raw hero levels for your loot. `,
    );
  } else if (ref.equipment.available && isTop) {
    parts.push(
      `As the current top Town Hall, there is no next level to chase — every upgrade, heroes and equipment alike, goes toward a maxed, war-ready account. `,
    );
  } else if (ref.equipment.available) {
    parts.push(
      `Hero equipment is a scored dimension from TH16 on, so it shares the queue with your hero levels here. `,
    );
  }
  parts.push(DIMENSIONS);
  return parts.join('');
}

function upgradeOrderSections(th: number): SeoSection[] {
  const ref = getTownHallReference(th);
  const fresh = newlyUnlockedHeroes(th);
  const equip = ref.equipment;
  const isTop = th === MAX_TOWN_HALL;
  const freshFirst = fresh.length > 0 && th > MIN_TOWN_HALL;
  const sections: SeoSection[] = [];

  sections.push(
    freshFirst
      ? {
          heading: `Bring the ${listNames(fresh)} online first`,
          body: `A freshly-unlocked hero starts far below the TH${th} caps (${heroCapText(th)}), so its early levels are the cheapest grade you can buy. For war and trophy goals CoachScore surfaces the ${listNames(fresh)} and your main attack upgrades first, because that is where the biggest gap to a maxed TH${th} sits.`,
        }
      : {
          heading: `Heroes and offense move your grade most at TH${th}`,
          body: `For war and pushing, hero levels and your main attack strategy move your grade the most at TH${th} (caps this Town Hall: ${heroCapText(th)}). CoachScore weights Heroes and Offense heavily under the war goal and surfaces the upgrades that close the biggest gap to a maxed account.`,
        },
  );

  sections.push({
    heading: "Don't out-run your defenses",
    body: `Pushing offense while defense lags is the most common TH${th} mistake. CoachScore's Progression dimension compares your base to the maxed TH${ref.previousTownHall} baseline you should have finished before moving up, then reports exactly how rushed you are and which defensive upgrades (key defenses cap around level ${ref.categories.defense.representativeMaxLevel} at TH${th}) to catch up on.`,
  });

  if (equip.available) {
    sections.push({
      heading: `Fit hero equipment into the plan (${equip.keyEpicsTotal} key pieces)`,
      body: `At TH${th} you have roughly ${equip.keyEpicsTotal} meta-relevant epic equipment pieces, each maxing around level ${equip.maxLevel}. Equipment compounds with hero levels, so CoachScore only prioritizes the pieces your actual army uses — and weighs them against any under-levelled hero so you do not pour loot into a fourth epic while a hero lags.`,
    });
  } else {
    sections.push({
      heading: 'Walls last, but not never',
      body: `Walls (max level ${ref.categories.walls.representativeMaxLevel} at TH${th}) are the cheapest grade per resource only once heroes and key defenses are in range. CoachScore schedules walls into the roadmap at the point where they start to matter, instead of letting them swallow loot too early.`,
    });
  }

  sections.push(
    isTop
      ? {
          heading: `TH${th} is the top — max for war, not the next Town Hall`,
          body: `There is no Town Hall above ${th} yet, so every upgrade goes toward a maxed, war-ready account rather than racing ahead. CoachScore shifts emphasis to the highest-impact remaining gaps — usually the most expensive heroes (${heroCapText(th)}) and equipment — so your grade climbs fastest toward S.`,
        }
      : {
          heading: `When is it safe to move to TH${th + 1}?`,
          body: `Move up once your TH${th} heroes, key defenses, and main army are close to their caps — not the moment the Town Hall upgrade finishes. A CoachScore at TH${th} shows whether you are maxed enough to advance without rushing into TH${th + 1}.`,
        },
  );

  return sections;
}

function upgradeOrderFaqs(th: number): SeoFaq[] {
  const ref = getTownHallReference(th);
  const fresh = newlyUnlockedHeroes(th);
  const freshFirst = fresh.length > 0 && th > MIN_TOWN_HALL;
  const isTop = th === MAX_TOWN_HALL;
  const faqs: SeoFaq[] = [
    {
      question: `What should I upgrade first at TH${th}?`,
      answer: freshFirst
        ? `Usually the hero you just unlocked (${listNames(fresh)}) and your primary offense, while keeping defenses within range of the TH${ref.previousTownHall} baseline. Run a free CoachScore for an order tuned to your account and goal.`
        : `Generally heroes and your primary offense for war goals, while keeping defenses in range so you do not become rushed. Run a free CoachScore for a roadmap ordered to your specific account and goal.`,
    },
    {
      question: `What are the max hero levels at TH${th}?`,
      answer: `At Town Hall ${th} the hero caps are ${heroCapText(th)}. These are best-effort values from the CoachScore reference table; confirm against the live game for edge cases.`,
    },
  ];
  if (!isTop) {
    faqs.push({
      question: `Should I rush to TH${th + 1}?`,
      answer: `Moving to TH${th + 1} before your TH${th} heroes and defenses are near their caps almost always lowers your grade and your war performance. CoachScore's rush check tells you whether you are ready to advance.`,
    });
  }
  if (ref.equipment.available) {
    faqs.push({
      question: `How much does hero equipment matter at TH${th}?`,
      answer: `From TH16 equipment is its own scored dimension. At TH${th} the ${ref.equipment.keyEpicsTotal} key epic pieces matter most when they power your main attack, so CoachScore weighs them against your hero levels to keep the order right.`,
    });
  }
  return faqs;
}

function upgradeOrderGuide(th: number): SeoGuide {
  const ref = getTownHallReference(th);
  const heroCount = heroIdsUnlockedAt(th).length;
  return {
    slug: `th${th}-upgrade-order-2026`,
    kind: 'upgrade_order',
    pillar: 'upgrade-order',
    townHall: th,
    title: `TH${th} upgrade order 2026 — what to upgrade first | CoachScore`,
    description: `A prioritized Town Hall ${th} upgrade order for 2026: sequence ${heroCount} heroes, offense, defense${ref.equipment.available ? ', hero equipment' : ''}, and walls by cost-weighted impact toward your goal.`,
    h1: `TH${th} upgrade order (2026)`,
    intro: upgradeOrderIntro(th),
    sections: upgradeOrderSections(th),
    dataPoints: upgradeOrderDataPoints(th),
    faqs: upgradeOrderFaqs(th),
    ctaText: CTA,
  };
}

function equipmentGuide(th: number): SeoGuide {
  const ref = getTownHallReference(th);
  const equip = ref.equipment;
  // Equipment guides are only built for TH16+, where equipment is available.
  const epics = equip.available ? equip.keyEpicsTotal : 0;
  const maxLevel = equip.available ? equip.maxLevel : 0;
  return {
    slug: `th${th}-hero-equipment-priority`,
    kind: 'equipment_priority',
    pillar: 'equipment',
    townHall: th,
    title: `Best TH${th} hero equipment priority (${epics} key epics) | CoachScore`,
    description: `Which hero equipment to level first at Town Hall ${th}: how CoachScore weighs ${epics} key epic pieces (max level ${maxLevel}) against hero levels and your attack strategy.`,
    h1: `Best TH${th} hero equipment priority`,
    intro: `Hero equipment is a major grade lever from TH16, and at TH${th} you are juggling about ${epics} meta-relevant epic pieces (each maxing around level ${maxLevel}) on top of your heroes (${heroCapText(th)}). The equipment that matters most is the set that powers your actual attack — not every piece equally. ${DIMENSIONS}`,
    sections: [
      {
        heading: 'Equipment follows your attack, not the meta blindly',
        body: `CoachScore's Equipment dimension rewards leveling the pieces your army actually uses. A maxed epic you never deploy moves your grade far less than the workhorse equipment behind your main strategy, so at TH${th} the order starts from what you bring to war.`,
      },
      {
        heading: 'Balance equipment against raw hero levels',
        body: `Equipment and hero levels compound. If a hero is behind for TH${th} (caps: ${heroCapText(th)}), hero levels usually return more grade per resource than chasing the ${epics}th epic — CoachScore makes that trade-off explicit in the roadmap.`,
      },
      {
        heading: `How equipment is weighted at TH${th}`,
        body: `Under the war goal CoachScore gives Equipment about a sixth of the grade at TH16+, just behind Heroes and Offense. That is enough to matter without letting one maxed piece paper over an under-developed account, so equipment rises in the order only once your core heroes are in range.`,
      },
    ],
    dataPoints: [
      { label: 'Key epic pieces', value: `${epics}` },
      { label: 'Equipment max level', value: `level ${maxLevel}` },
      { label: 'Heroes at this TH', value: heroCapText(th) },
      {
        label: 'Equipment scored from',
        value: `TH${EQUIPMENT_MIN_TH}+`,
      },
    ],
    faqs: [
      {
        question: `Which hero equipment should I upgrade first at TH${th}?`,
        answer: `Prioritize the equipment your main attack relies on, balanced against catching up any under-levelled hero. A free CoachScore ranks the ${epics} key pieces for your account.`,
      },
      {
        question: `How many epic equipment pieces matter at TH${th}?`,
        answer: `Around ${epics} are meta-relevant at TH${th}, each maxing near level ${maxLevel}. You rarely need all of them maxed — only the ones behind your real army.`,
      },
    ],
    ctaText: CTA,
  };
}

function rushCheckGuide(): SeoGuide {
  return {
    slug: 'is-my-account-rushed',
    kind: 'rush_check',
    pillar: 'rush',
    townHall: null,
    title:
      'Is my account rushed? Free Clash of Clans rush checker | CoachScore',
    description:
      'Find out if your Clash of Clans account is rushed in under a minute. CoachScore measures how far your Town Hall has out-paced your defenses, heroes, and offense — across TH11–18.',
    h1: 'Is my account rushed? (free checker)',
    intro:
      'A "rushed" account is one whose Town Hall level has out-run the upgrades that should come with it — under-levelled defenses, heroes, and troops for the Town Hall you are sitting at. CoachScore measures exactly that with its Progression dimension, comparing your base to the maxed baseline of the previous Town Hall and reporting a clear rush label. ' +
      DIMENSIONS,
    sections: [
      {
        heading: 'What "rushed" actually means',
        body: 'Rush is not one number from a single building — it is how far your whole base lags the maxed baseline for your Town Hall. CoachScore compares your heroes, key defenses, and offense to that baseline and reports a clear rush label, not a vague vibe.',
      },
      {
        heading: 'Why it matters',
        body: 'Rushed accounts win fewer wars, get tripled more often, and waste loot upgrading the wrong things. Knowing your rush level tells you whether to catch up before moving to the next Town Hall — the single highest-leverage decision in the late game.',
      },
      {
        heading: 'How to de-rush, in order',
        body: 'Catch up the cheapest high-impact gaps first: under-levelled heroes and key defenses for your current Town Hall, then offense, then walls. CoachScore turns your rush label into an ordered roadmap so de-rushing is a checklist, not a guess.',
      },
    ],
    dataPoints: [
      {
        label: 'Town Halls covered',
        value: `TH${MIN_TOWN_HALL}–${MAX_TOWN_HALL}`,
      },
      { label: 'Rush signal', value: 'Progression vs. previous-TH baseline' },
      { label: 'Time to result', value: 'Under a minute, free' },
    ],
    faqs: [
      {
        question: 'How do I know if my account is rushed?',
        answer:
          'Run a free CoachScore — it reads your account, compares it to the maxed baseline for your Town Hall, and gives you a rush label plus the upgrades that would de-rush you fastest.',
      },
      {
        question: 'Is rushing always bad?',
        answer:
          'Not always — some players rush deliberately for cheap offense. But for war and trophies a rushed base scores lower and loses more. CoachScore shows the trade-off for your account so you can decide with data.',
      },
    ],
    ctaText: CTA,
  };
}

export function buildSeoGuides(): readonly SeoGuide[] {
  const guides: SeoGuide[] = [rushCheckGuide()];
  for (const th of townHalls()) {
    guides.push(upgradeOrderGuide(th));
    if (th >= EQUIPMENT_MIN_TH) guides.push(equipmentGuide(th));
  }
  return guides;
}

export const SEO_GUIDES: readonly SeoGuide[] = buildSeoGuides();

export function getSeoGuide(slug: string): SeoGuide | null {
  return SEO_GUIDES.find((g) => g.slug === slug) ?? null;
}

export const SEO_GUIDE_SLUGS: readonly string[] = SEO_GUIDES.map((g) => g.slug);

/** All guides in one pillar, in build order — used by the pillar hubs (§5/§12). */
export function guidesByPillar(pillar: SeoPillar): readonly SeoGuide[] {
  return SEO_GUIDES.filter((g) => g.pillar === pillar);
}

export const SEO_PILLARS: readonly SeoPillar[] = [
  'rush',
  'upgrade-order',
  'equipment',
  'account-rating',
];
