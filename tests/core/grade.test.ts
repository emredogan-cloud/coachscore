import { describe, expect, it } from 'vitest';
import { GRADE_BANDS, toGrade } from '@/lib/core/grade';

describe('toGrade', () => {
  it('maps boundary scores to the correct letter (deep-dive §7.3 scale)', () => {
    expect(toGrade(100)).toBe('S');
    expect(toGrade(90)).toBe('S');
    expect(toGrade(89)).toBe('A');
    expect(toGrade(80)).toBe('A');
    expect(toGrade(79)).toBe('B');
    expect(toGrade(70)).toBe('B');
    expect(toGrade(69)).toBe('C');
    expect(toGrade(60)).toBe('C');
    expect(toGrade(59)).toBe('D');
    expect(toGrade(50)).toBe('D');
    expect(toGrade(49)).toBe('F');
    expect(toGrade(0)).toBe('F');
  });

  it('throws on out-of-range or non-finite input', () => {
    expect(() => toGrade(-1)).toThrow(RangeError);
    expect(() => toGrade(101)).toThrow(RangeError);
    expect(() => toGrade(Number.NaN)).toThrow(RangeError);
    expect(() => toGrade(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe('GRADE_BANDS', () => {
  it('exposes six contiguous bands covering 0..100', () => {
    const bands = GRADE_BANDS;
    expect(bands).toHaveLength(6);
    expect(bands[0]?.max).toBe(100);

    // Bands are ordered high→low and tile [0,100] with no gaps or overlaps.
    let expectedMax = 100;
    for (const band of bands) {
      expect(band.max).toBe(expectedMax);
      expect(band.min).toBeLessThanOrEqual(band.max);
      expectedMax = band.min - 1;
    }
    expect(expectedMax).toBe(-1); // last band min was 0
  });
});
