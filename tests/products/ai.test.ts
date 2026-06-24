import { describe, expect, it } from 'vitest';
import { analyzeReplay, draftProductNotes } from '@/lib/products';
import type { ReplayInput } from '@/lib/products';
import { fakeProvider } from '../intake/helpers';

const analysis = analyzeReplay({
  townHall: 14,
  context: 'war',
  starsEarned: 2,
  destructionPct: 80,
  durationSec: 180,
  timeRemainingSec: 30,
  army: [],
  heroesUsed: [],
  heroesAvailable: [],
  spellsUsed: [],
} as ReplayInput);

describe('draftProductNotes', () => {
  it('enriches with AI summary + extra recommendations on a valid draft', async () => {
    const provider = fakeProvider({
      summary:
        'A tight, grounded summary of the attack well over twenty chars.',
      recommendations: ['Deploy heroes earlier.', 'Bring rage for the core.'],
    });
    const result = await draftProductNotes('replay_doctor', analysis, {
      provider,
    });
    expect(result.aiAuthored).toBe(true);
    expect(result.confidence).toBe(0.9);
    expect(result.extraRecommendations).toHaveLength(2);
    expect(result.summary).not.toBeNull();
  });

  it('falls back deterministically when the model returns an invalid shape', async () => {
    const result = await draftProductNotes('replay_doctor', analysis, {
      provider: fakeProvider({ not: 'valid' }),
    });
    expect(result.aiAuthored).toBe(false);
    expect(result.confidence).toBe(0.6);
    expect(result.extraRecommendations).toHaveLength(0);
    expect(result.summary).toBeNull();
  });
});
