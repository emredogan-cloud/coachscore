import { describe, expect, it } from 'vitest';
import {
  MAX_TOWN_HALL,
  MIN_TOWN_HALL,
  ReferenceTableError,
  getTownHallReference,
  heroIdsUnlockedAt,
  validateReferenceTable,
} from '@/lib/game-data';

describe('Game-Data Reference Table — structural validity', () => {
  const result = validateReferenceTable();

  it('has no structural errors', () => {
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('covers Town Halls 11 through 18', () => {
    expect(result.townHallsCovered).toBe(MAX_TOWN_HALL - MIN_TOWN_HALL + 1);
    for (let th = MIN_TOWN_HALL; th <= MAX_TOWN_HALL; th++) {
      expect(() => getTownHallReference(th)).not.toThrow();
    }
  });

  it('throws a typed error outside the covered range', () => {
    expect(() => getTownHallReference(10)).toThrow(ReferenceTableError);
    expect(() => getTownHallReference(19)).toThrow(ReferenceTableError);
  });
});

describe('Game-Data Reference Table — verified source values', () => {
  it('matches the deep-dive TH13 hero caps (BK75/AQ75/GW55/RC25)', () => {
    const th13 = getTownHallReference(13);
    expect(th13.heroes.barbarianKing.maxLevel).toBe(75);
    expect(th13.heroes.archerQueen.maxLevel).toBe(75);
    expect(th13.heroes.grandWarden.maxLevel).toBe(55);
    expect(th13.heroes.royalChampion.maxLevel).toBe(25);
    // These four are source-confirmed, so they carry no verification debt.
    expect(th13.heroes.barbarianKing.needsVerification).toBe(false);
    expect(th13.heroes.royalChampion.needsVerification).toBe(false);
  });

  it('matches the deep-dive TH14 hero caps (BK80/AQ80/GW60/RC30)', () => {
    const th14 = getTownHallReference(14);
    expect(th14.heroes.barbarianKing.maxLevel).toBe(80);
    expect(th14.heroes.archerQueen.maxLevel).toBe(80);
    expect(th14.heroes.grandWarden.maxLevel).toBe(60);
    expect(th14.heroes.royalChampion.maxLevel).toBe(30);
  });

  it('marks equipment N/A below TH16 and available at TH16+', () => {
    for (let th = MIN_TOWN_HALL; th < 16; th++) {
      expect(getTownHallReference(th).equipment.available).toBe(false);
    }
    for (let th = 16; th <= MAX_TOWN_HALL; th++) {
      expect(getTownHallReference(th).equipment.available).toBe(true);
    }
  });
});

describe('Game-Data Reference Table — hero unlock progression', () => {
  it('unlocks the Royal Champion at TH13 (not before)', () => {
    expect(heroIdsUnlockedAt(12)).not.toContain('royalChampion');
    expect(heroIdsUnlockedAt(13)).toContain('royalChampion');
  });

  it('unlocks the Grand Warden from TH11', () => {
    expect(heroIdsUnlockedAt(11)).toContain('grandWarden');
  });

  it('keeps locked heroes at maxLevel 0 with zero weight', () => {
    const th11 = getTownHallReference(11);
    expect(th11.heroes.royalChampion.unlocked).toBe(false);
    expect(th11.heroes.royalChampion.maxLevel).toBe(0);
    expect(th11.heroes.royalChampion.deCostWeight).toBe(0);
  });
});

describe('Game-Data Reference Table — verification debt is tracked honestly', () => {
  it('reports outstanding verification debt for best-effort values', () => {
    const result = validateReferenceTable();
    // Best-effort building/troop/wall caps are deliberately flagged, not faked.
    expect(result.verificationDebt.length).toBeGreaterThan(0);
  });

  it('does not flag the source-verified TH13/TH14 hero caps as debt', () => {
    const result = validateReferenceTable();
    expect(result.verificationDebt).not.toContain('TH13 hero "royalChampion"');
    expect(result.verificationDebt).not.toContain('TH14 hero "barbarianKing"');
  });
});
