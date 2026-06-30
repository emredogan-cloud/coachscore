import { describe, expect, it } from 'vitest';
import {
  completeDefense,
  DEFENSE_CONFIDENCE_THRESHOLD,
  UPLOAD_LIMITS,
  validateUpload,
  type UploadCandidate,
} from '@/lib/intake';

const png = (size = 1000, name = 'a.png'): UploadCandidate => ({
  name,
  type: 'image/png',
  size,
});

describe('validateUpload — allowed types', () => {
  it.each(['image/png', 'image/jpeg', 'image/webp'])('accepts %s', (type) => {
    const r = validateUpload([{ name: 'x', type, size: 1000 }]);
    expect(r.ok).toBe(true);
    expect(r.accepted).toHaveLength(1);
  });

  it.each([
    'image/gif',
    'image/bmp',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'image/heic',
    'video/mp4',
    '',
  ])('rejects %s', (type) => {
    const r = validateUpload([{ name: 'x', type, size: 1000 }]);
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });
});

describe('validateUpload — counts + sizes', () => {
  it('rejects an empty batch', () => {
    expect(validateUpload([]).ok).toBe(false);
  });

  it.each([1, 2, 3, 4])('accepts %d valid files', (n) => {
    const r = validateUpload(
      Array.from({ length: n }, (_, i) => png(1000, `f${i}.png`)),
    );
    expect(r.ok).toBe(true);
    expect(r.accepted).toHaveLength(n);
  });

  it.each([5, 6, 8])('rejects %d files (over max)', (n) => {
    const r = validateUpload(
      Array.from({ length: n }, (_, i) => png(1000, `f${i}.png`)),
    );
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/too many/i);
  });

  it('rejects a file over the per-file size cap', () => {
    const r = validateUpload([png(UPLOAD_LIMITS.maxBytesPerFile + 1)]);
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/too large/i);
  });

  it('rejects when the total exceeds the cap', () => {
    const big = UPLOAD_LIMITS.maxBytesPerFile;
    const r = validateUpload([
      png(big, 'a.png'),
      png(big, 'b.png'),
      png(big, 'c.png'),
    ]);
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/total/i);
  });

  it('keeps valid files and reports errors for invalid ones in a mixed batch', () => {
    const r = validateUpload([
      png(1000, 'good.png'),
      { name: 'bad.gif', type: 'image/gif', size: 1000 },
    ]);
    expect(r.errors.length).toBe(1);
    expect(r.accepted).toHaveLength(1);
  });

  it.each([1, 100_000, 1_000_000, UPLOAD_LIMITS.maxBytesPerFile])(
    'accepts a file of %d bytes',
    (size) => {
      expect(validateUpload([png(size)]).ok).toBe(true);
    },
  );
});

describe('completeDefense — confidence handling (never fabricate)', () => {
  it('accepts a high-confidence read without confirmation', () => {
    const r = completeDefense({
      defensePercent: 80,
      wallsAtMaxPercent: 70,
      confidence: 0.9,
    });
    expect(r.needsConfirmation).toBe(false);
    expect(r.defensePercent).toBe(80);
    expect(r.wallsAtMaxPercent).toBe(70);
  });

  it('asks for confirmation on a low-confidence read', () => {
    const r = completeDefense({
      defensePercent: 60,
      wallsAtMaxPercent: 50,
      confidence: 0.4,
    });
    expect(r.needsConfirmation).toBe(true);
    expect(r.note).toMatch(/confirm|correct/i);
  });

  it.each([
    [0.69, true],
    [DEFENSE_CONFIDENCE_THRESHOLD, false],
    [0.71, false],
    [0.95, false],
    [0.2, true],
  ])('confidence %f → needsConfirmation %s', (confidence, expected) => {
    expect(
      completeDefense({ defensePercent: 50, wallsAtMaxPercent: 50, confidence })
        .needsConfirmation,
    ).toBe(expected);
  });

  it('clamps out-of-range values', () => {
    const r = completeDefense({
      defensePercent: 130,
      wallsAtMaxPercent: -10,
      confidence: 1.4,
    });
    expect(r.defensePercent).toBe(100);
    expect(r.wallsAtMaxPercent).toBe(0);
    expect(r.confidence).toBe(1);
  });

  it.each([0, 0.1, 0.3, 0.5, 0.6, 0.65])(
    'confidence %f below threshold always asks to confirm',
    (c) => {
      expect(
        completeDefense({
          defensePercent: 70,
          wallsAtMaxPercent: 70,
          confidence: c,
        }).needsConfirmation,
      ).toBe(true);
    },
  );

  it.each([0.7, 0.75, 0.8, 0.9, 1])(
    'confidence %f at/above threshold accepts the read',
    (c) => {
      expect(
        completeDefense({
          defensePercent: 70,
          wallsAtMaxPercent: 70,
          confidence: c,
        }).needsConfirmation,
      ).toBe(false);
    },
  );

  it.each([0, 25, 50, 75, 100])('rounds defense %d cleanly', (d) => {
    expect(
      completeDefense({
        defensePercent: d,
        wallsAtMaxPercent: 0,
        confidence: 1,
      }).defensePercent,
    ).toBe(d);
  });
});

describe('validateUpload — extra edge cases', () => {
  it('handles a file with no name', () => {
    const r = validateUpload([{ name: '', type: 'image/gif', size: 100 }]);
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/file/);
  });

  it('accepts a total exactly at the cap', () => {
    const each = Math.floor(UPLOAD_LIMITS.maxTotalBytes / 3);
    const r = validateUpload([png(each, 'a'), png(each, 'b'), png(each, 'c')]);
    expect(r.ok).toBe(true);
  });
});
