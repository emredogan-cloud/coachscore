import { describe, expect, it } from 'vitest';
import {
  detectMilestones,
  summarizeProgress,
  type ScoreEntry,
} from '@/lib/history';

const e = (over: Partial<ScoreEntry> & { at: number }): ScoreEntry => ({
  tag: '#X',
  grade: 'B',
  overall: 72,
  townHall: 16,
  goal: 'rate',
  ...over,
});

describe('summarizeProgress', () => {
  it('handles an empty history', () => {
    const s = summarizeProgress([]);
    expect(s.count).toBe(0);
    expect(s.latest).toBeNull();
    expect(s.overallDelta).toBeNull();
  });

  it('computes delta vs the previous check and personal best', () => {
    const s = summarizeProgress([
      e({ at: 1, overall: 60, grade: 'C' }),
      e({ at: 2, overall: 72, grade: 'B' }),
    ]);
    expect(s.count).toBe(2);
    expect(s.overallDelta).toBe(12);
    expect(s.best).toBe(72);
    expect(s.isBest).toBe(true);
  });

  it('orders entries chronologically regardless of input order', () => {
    const s = summarizeProgress([
      e({ at: 3, overall: 80 }),
      e({ at: 1, overall: 60 }),
      e({ at: 2, overall: 70 }),
    ]);
    expect(s.latest?.overall).toBe(80);
    expect(s.previous?.overall).toBe(70);
  });
});

describe('detectMilestones', () => {
  it('flags a new personal best + grade up', () => {
    const m = detectMilestones([
      e({ at: 1, overall: 60, grade: 'C' }),
      e({ at: 2, overall: 82, grade: 'A' }),
    ]);
    expect(m).toContain('New personal best');
    expect(m).toContain('Grade up: C → A');
    expect(m).toContain('First A!');
  });

  it('flags de-rush when the rush label improves', () => {
    const m = detectMilestones([
      e({ at: 1, overall: 60, rushLabel: 'Heavily Rushed' }),
      e({ at: 2, overall: 75, rushLabel: 'Well-Developed' }),
    ]);
    expect(m).toContain('De-rushed');
  });

  it('returns nothing for a single first-ever check', () => {
    expect(detectMilestones([e({ at: 1 })])).toEqual([]);
  });
});
