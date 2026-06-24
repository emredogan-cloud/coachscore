/**
 * Programmatic SEO pages (Phase 7). Per-Town-Hall evergreen guides generated
 * from the real reference-table range (TH11–18) — the roadmap's highest-ROI,
 * compounding channel. Content is the CoachScore methodology (the seven scoring
 * dimensions + goal-aware prioritization + rush detection), NOT fabricated game
 * caps (ADR-0004): genuinely useful pages, never thin doorways. Each ends in the
 * free-checker CTA. Equipment guides exist only for Town Halls that have hero
 * equipment (TH16+).
 */

import { MAX_TOWN_HALL, MIN_TOWN_HALL } from '@/lib/game-data';

export type SeoGuideKind =
  | 'upgrade_order'
  | 'rush_check'
  | 'equipment_priority';

export interface SeoSection {
  readonly heading: string;
  readonly body: string;
}

export interface SeoGuide {
  readonly slug: string;
  readonly kind: SeoGuideKind;
  readonly townHall: number | null;
  readonly title: string;
  readonly description: string;
  readonly h1: string;
  readonly intro: string;
  readonly sections: readonly SeoSection[];
  readonly faqs: readonly { question: string; answer: string }[];
  readonly ctaText: string;
}

const EQUIPMENT_MIN_TH = 16;
const CTA = 'Get your free CoachScore in under a minute — no account required.';

const DIMENSIONS =
  'CoachScore grades seven dimensions: Heroes, Offense, Defense, Equipment, ' +
  'Progression (rush), Walls, and Clan value. The roadmap is ordered by ' +
  'cost-weighted impact, so the cheapest upgrades that move your grade the most ' +
  'come first.';

function townHalls(): number[] {
  const out: number[] = [];
  for (let th = MIN_TOWN_HALL; th <= MAX_TOWN_HALL; th++) out.push(th);
  return out;
}

function upgradeOrderGuide(th: number): SeoGuide {
  return {
    slug: `th${th}-upgrade-order-2026`,
    kind: 'upgrade_order',
    townHall: th,
    title: `TH${th} upgrade order 2026 — what to upgrade first | CoachScore`,
    description: `A prioritized Town Hall ${th} upgrade order for 2026: how to sequence heroes, offense, defense, and walls by cost-weighted impact toward your goal.`,
    h1: `TH${th} upgrade order (2026)`,
    intro: `Sitting at Town Hall ${th} and not sure what to upgrade next? The right order depends on your goal — war, trophies, or farming — and on which upgrades buy the most grade per resource. ${DIMENSIONS}`,
    sections: [
      {
        heading: 'Heroes and offense come first for war',
        body: `For war and pushing, hero levels and your main attack strategy move your grade the most at TH${th}. CoachScore weights Heroes and Offense heavily under the war goal, so it surfaces the hero and troop upgrades that close the biggest gap to a maxed TH${th} account.`,
      },
      {
        heading: "Don't out-run your defenses",
        body: `Rushing offense while defense lags is the most common TH${th} mistake. The Progression (rush) dimension penalizes accounts whose Town Hall has out-paced its buildings — a fresh CoachScore tells you exactly how rushed you are and which defensive upgrades to catch up on.`,
      },
      {
        heading: 'Walls last, but not never',
        body: `Walls are the cheapest grade per resource only once heroes and key defenses are in range. CoachScore schedules walls into the roadmap at the point where they start to matter, rather than dumping all your loot into them too early.`,
      },
    ],
    faqs: [
      {
        question: `What should I upgrade first at TH${th}?`,
        answer: `Generally heroes and your primary offense for war goals, while keeping defenses within range to avoid being rushed. Run a free CoachScore for a roadmap ordered to your specific account and goal.`,
      },
    ],
    ctaText: CTA,
  };
}

function equipmentGuide(th: number): SeoGuide {
  return {
    slug: `th${th}-hero-equipment-priority`,
    kind: 'equipment_priority',
    townHall: th,
    title: `Best TH${th} hero equipment priority | CoachScore`,
    description: `Which hero equipment to level first at Town Hall ${th}: how CoachScore weighs equipment against hero levels and your attack strategy.`,
    h1: `Best TH${th} hero equipment priority`,
    intro: `Hero equipment is a major grade lever from TH16 onward. At TH${th}, the equipment that matters most is the set that powers your actual attack strategy — not every piece equally.`,
    sections: [
      {
        heading: 'Equipment follows your attack, not the meta blindly',
        body: `CoachScore's Equipment dimension rewards leveling the equipment your army actually uses. A maxed piece you never deploy moves your grade less than the workhorse equipment behind your main strategy.`,
      },
      {
        heading: 'Balance equipment with raw hero levels',
        body: `Equipment and hero levels compound. If your heroes are behind for TH${th}, hero levels usually return more grade per resource than chasing a fourth or fifth equipment — CoachScore makes that trade-off explicit in the roadmap.`,
      },
    ],
    faqs: [
      {
        question: `Which hero equipment should I upgrade first at TH${th}?`,
        answer: `Prioritize the equipment your main attack strategy relies on, balanced against catching up any under-leveled heroes. A free CoachScore ranks it for your account.`,
      },
    ],
    ctaText: CTA,
  };
}

function rushCheckGuide(): SeoGuide {
  return {
    slug: 'is-my-account-rushed',
    kind: 'rush_check',
    townHall: null,
    title:
      'Is my account rushed? Free Clash of Clans rush checker | CoachScore',
    description:
      'Find out if your Clash of Clans account is rushed in under a minute. CoachScore measures how far your Town Hall has out-paced your defenses, heroes, and offense.',
    h1: 'Is my account rushed? (free checker)',
    intro:
      'A "rushed" account is one whose Town Hall level has out-run the upgrades that should come with it — under-levelled defenses, heroes, and troops for the Town Hall you are sitting at. CoachScore measures exactly that with its Progression dimension and a rush label.',
    sections: [
      {
        heading: 'What "rushed" actually means',
        body: 'Rush is not a single number from one building — it is how far your whole base lags the maxed baseline for your Town Hall. CoachScore compares your heroes, key defenses, and offense to that baseline and reports a clear rush label.',
      },
      {
        heading: 'Why it matters',
        body: 'Rushed accounts win fewer wars, get tripled more often, and waste loot upgrading the wrong things. Knowing your rush level tells you whether to catch up before moving to the next Town Hall.',
      },
    ],
    faqs: [
      {
        question: 'How do I know if my account is rushed?',
        answer:
          'Run a free CoachScore — it reads your account, compares it to the maxed baseline for your Town Hall, and gives you a rush label plus the upgrades that would de-rush you fastest.',
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
