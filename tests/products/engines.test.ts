import { describe, expect, it } from 'vitest';
import { analyzeBase, analyzeReplay, buildWarPlan } from '@/lib/products';
import type { BaseInput, ReplayInput, WarInput } from '@/lib/products';

describe('analyzeReplay', () => {
  const input: ReplayInput = {
    townHall: 14,
    context: 'war',
    starsEarned: 2,
    destructionPct: 80,
    durationSec: 180,
    timeRemainingSec: 30,
    army: [{ name: 'hybrid', count: 1 }],
    heroesUsed: ['barbarianKing'],
    heroesAvailable: ['barbarianKing', 'archerQueen'],
    spellsUsed: [],
  };

  it('scores the attack and surfaces concrete mistakes', () => {
    const a = analyzeReplay(input);
    expect(a.score?.label).toBe('Attack score');
    expect(a.score?.value).toBeGreaterThan(0);
    expect(a.score?.value).toBeLessThanOrEqual(100);
    const mistakes = a.sections.find((s) => s.key === 'mistakes');
    expect(mistakes?.items.join(' ')).toContain('archerQueen'); // unused hero
    expect(mistakes?.items.join(' ')).toContain('spells'); // none used
    expect(a.recommendations.length).toBeGreaterThan(0);
    expect(a.sections.map((s) => s.key)).toEqual([
      'mistakes',
      'timing',
      'diagnosis',
    ]);
  });

  it('a clean three-star has no major mistakes', () => {
    const a = analyzeReplay({
      ...input,
      starsEarned: 3,
      destructionPct: 100,
      heroesUsed: ['barbarianKing', 'archerQueen'],
      spellsUsed: ['rage'],
    });
    expect(a.score?.value).toBe(100);
    expect(a.sections.find((s) => s.key === 'mistakes')?.items[0]).toContain(
      'No major',
    );
  });
});

describe('analyzeBase', () => {
  const input: BaseInput = {
    townHall: 14,
    layoutType: 'war',
    goal: 'war_defense',
    townHallCentralized: false,
    coreBuildings: [{ name: 'eagle', centralized: false }],
    airDefenseCount: 4,
    airDefenseSpread: false,
    trapCount: 4,
    wallsMaxed: false,
    screenshotsCount: 1,
  };

  it('flags an exposed Town Hall + clustered air defense and docks the score', () => {
    const a = analyzeBase(input);
    const weaknesses = a.sections.find((s) => s.key === 'weaknesses');
    expect(weaknesses?.items.join(' ')).toContain('Town Hall is exposed');
    expect(weaknesses?.items.join(' ')).toContain('Air defenses are clustered');
    expect(a.score?.label).toBe('Defense readiness');
    expect(a.score?.value).toBeLessThan(80);
    expect(a.sections.map((s) => s.key)).toEqual([
      'weaknesses',
      'traps',
      'anti_meta',
      'roadmap',
    ]);
  });
});

describe('buildWarPlan', () => {
  const input: WarInput = {
    attackerTownHall: 13,
    defenderTownHall: 14,
    defenderBaseType: 'anti_ground',
    objective: 'three_star',
    roster: { army: 'hybrid', heroes: ['bk', 'aq'], armyStrength: 'high' },
    spellsAvailable: ['rage', 'heal', 'freeze'],
  };

  it('produces a full plan with all sections and a probability estimate', () => {
    const a = buildWarPlan(input);
    expect(a.sections.map((s) => s.key)).toEqual([
      'plan',
      'army',
      'spell_timing',
      'hero_timing',
      'contingency',
    ]);
    expect(a.score?.label).toContain('three-star');
    expect(a.score?.value).toBeGreaterThan(0);
    expect(a.score?.value).toBeLessThan(95);
  });

  it('dipping up is harder than dipping down', () => {
    const up = buildWarPlan({ ...input, attackerTownHall: 12 }); // gap +2
    const down = buildWarPlan({ ...input, attackerTownHall: 15 }); // gap -2
    expect(down.score?.value).toBeGreaterThan(up.score?.value ?? 0);
  });
});
