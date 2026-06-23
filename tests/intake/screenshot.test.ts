import { describe, expect, it } from 'vitest';
import {
  applyCorrections,
  intakeByScreenshot,
  mapExtractedToFields,
} from '@/lib/intake';
import type { ExtractedField, ProviderImage } from '@/lib/ai';
import { fakeProvider } from './helpers';

const image: ProviderImage = { mediaType: 'image/png', dataBase64: 'AAAA' };

describe('applyCorrections', () => {
  it('overrides extracted values and marks them trusted', () => {
    const fields: ExtractedField[] = [
      {
        key: 'barbarianKing',
        value: 70,
        confidence: 0.5,
        needsConfirmation: true,
      },
    ];
    const out = applyCorrections(fields, { barbarianKing: 72 });
    expect(out[0]).toEqual({
      key: 'barbarianKing',
      value: 72,
      confidence: 1,
      needsConfirmation: false,
    });
  });

  it('adds correction keys that were not extracted', () => {
    const out = applyCorrections([], { offensePercent: 80 });
    expect(out).toHaveLength(1);
    expect(out[0]?.key).toBe('offensePercent');
  });
});

describe('mapExtractedToFields', () => {
  it('maps hero, percent, wall and equipment keys', () => {
    const fields: ExtractedField[] = [
      {
        key: 'barbarianKing',
        value: 90,
        confidence: 1,
        needsConfirmation: false,
      },
      {
        key: 'offensePercent',
        value: 80,
        confidence: 1,
        needsConfirmation: false,
      },
      {
        key: 'wallsTotal',
        value: 100,
        confidence: 1,
        needsConfirmation: false,
      },
      {
        key: 'wallsAtOrAboveThMax',
        value: 60,
        confidence: 1,
        needsConfirmation: false,
      },
      {
        key: 'equipmentLevelSum',
        value: 40,
        confidence: 1,
        needsConfirmation: false,
      },
    ];
    const mapped = mapExtractedToFields(fields, 16, {
      donationBehavior: 0.5,
      warContribution: 0.5,
      capitalContribution: 0.5,
      activitySignal: 0.5,
    });
    expect(mapped.townHall).toBe(16);
    expect(mapped.heroLevels.barbarianKing).toBe(90);
    expect(mapped.offensePercent).toBe(80);
    expect(mapped.walls).toEqual({ atOrAboveThMax: 60, total: 100 });
    expect(mapped.equipment?.levelSum).toBe(40);
  });
});

describe('intakeByScreenshot', () => {
  it('extracts, routes confidence, and snapshots', async () => {
    const provider = fakeProvider({
      fields: [
        { key: 'barbarianKing', value: 72, confidence: 0.95 },
        { key: 'offensePercent', value: 85, confidence: 0.4 },
        { key: 'wallsTotal', value: 100, confidence: 0.9 },
        { key: 'wallsAtOrAboveThMax', value: 80, confidence: 0.9 },
      ],
    });
    const result = await intakeByScreenshot(
      { images: [image], context: 'TH14 war', townHall: 14, goal: 'war' },
      { provider },
    );
    expect(result.ok).toBe(true);
    expect(result.source).toBe('screenshot');
    expect(result.snapshot).not.toBeNull();
    // offensePercent was read at 0.4 confidence → flagged for confirmation.
    expect(result.fieldsNeedingConfirmation).toContain('offensePercent');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThan(1);
  });

  it('degrades to an empty result when OCR returns an invalid shape', async () => {
    const provider = fakeProvider({ not: 'valid' });
    const result = await intakeByScreenshot(
      { images: [image], context: '', townHall: 14, goal: 'war' },
      { provider },
    );
    // Extraction yields no fields → confidence 0; still a structured result.
    expect(result.confidence).toBe(0);
  });
});
