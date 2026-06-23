import { describe, expect, it } from 'vitest';
import {
  intakeByTag,
  InvalidPlayerTagError,
  parsePlayerTag,
  type CocAccountData,
  type CocApiAdapter,
  type IntakeFields,
} from '@/lib/intake';

const fields: IntakeFields = {
  townHall: 14,
  heroLevels: {
    barbarianKing: 72,
    archerQueen: 75,
    grandWarden: 48,
    royalChampion: 22,
  },
  offensePercent: 85,
  defensePercent: 82,
  progressionPercent: 93,
  walls: { atOrAboveThMax: 85, total: 100 },
  clan: {
    donationBehavior: 0.78,
    warContribution: 0.78,
    capitalContribution: 0.78,
    activitySignal: 0.78,
  },
};

describe('parsePlayerTag', () => {
  it('canonicalizes to #UPPER and strips a leading #', () => {
    expect(parsePlayerTag('2pp0')).toBe('#2PP0');
    expect(parsePlayerTag('#2pp0')).toBe('#2PP0');
  });

  it('throws on invalid characters', () => {
    expect(() => parsePlayerTag('#ZZZ')).toThrow(InvalidPlayerTagError);
    expect(() => parsePlayerTag('')).toThrow(InvalidPlayerTagError);
  });
});

describe('intakeByTag', () => {
  it('fails cleanly on an invalid tag', async () => {
    const result = await intakeByTag('not-a-tag!', 'war');
    expect(result.ok).toBe(false);
    expect(result.notActivated).toBe(false);
  });

  it('reports notActivated with the default (unconfigured) adapter', async () => {
    const result = await intakeByTag('#2PP0', 'war');
    expect(result.ok).toBe(false);
    expect(result.notActivated).toBe(true);
    expect(result.errors[0]).toMatch(/not activated/i);
  });

  it('normalizes + snapshots when a real adapter returns data', async () => {
    const adapter: CocApiAdapter = {
      async fetchAccount(playerTag: string): Promise<CocAccountData> {
        return { playerTag, fields };
      },
    };
    const result = await intakeByTag('#2PP0', 'war', { adapter });
    expect(result.ok).toBe(true);
    expect(result.source).toBe('tag');
    expect(result.snapshot).not.toBeNull();
    expect(result.snapshot?.provenance.note).toBe('#2PP0');
  });

  it('surfaces unexpected adapter errors as a failed result', async () => {
    const adapter: CocApiAdapter = {
      async fetchAccount(): Promise<CocAccountData> {
        throw new Error('proxy timeout');
      },
    };
    const result = await intakeByTag('#2PP0', 'war', { adapter });
    expect(result.ok).toBe(false);
    expect(result.notActivated).toBe(false);
    expect(result.errors[0]).toBe('proxy timeout');
  });
});
