import { describe, expect, it } from 'vitest';
import { routeExtractionConfidence, scoreDraftConfidence } from '@/lib/ai';
import type { ReportDraft } from '@/lib/ai';
import { th14WarResult, validDraftFor } from './helpers';

describe('scoreDraftConfidence', () => {
  const result = th14WarResult();

  it('scores a top-gap-covering, valid draft at or above the floor', () => {
    const draft = validDraftFor(result) as ReportDraft;
    const c = scoreDraftConfidence(draft, result);
    expect(c.score).toBeGreaterThanOrEqual(0.6);
  });

  it('lowers confidence when the roadmap covers few top gaps', () => {
    const lastGap = result.gaps[result.gaps.length - 1];
    if (!lastGap) throw new Error('expected gaps');
    const thin: ReportDraft = {
      diagnosis:
        'A valid-length diagnosis that covers only one minor gap here.',
      roadmap: [
        {
          rank: 1,
          elementId: lastGap.id,
          fromLevel: lastGap.level,
          toLevel: lastGap.maxLevel,
          rationale: 'only addresses a low-priority gap',
          estimatedImpact: 'low',
        },
      ],
      goalTips: ['tip'],
    };
    const full = scoreDraftConfidence(
      validDraftFor(result) as ReportDraft,
      result,
    );
    const thinScore = scoreDraftConfidence(thin, result);
    expect(thinScore.score).toBeLessThan(full.score);
    expect(thinScore.flags.length).toBeGreaterThan(0);
  });

  it('penalizes untraceable prose numbers', () => {
    const draft = validDraftFor(result) as ReportDraft;
    const clean = scoreDraftConfidence(draft, result, 0);
    const noisy = scoreDraftConfidence(draft, result, 3);
    expect(noisy.score).toBeLessThan(clean.score);
  });
});

describe('routeExtractionConfidence', () => {
  it('flags fields below the confidence floor for confirmation', () => {
    const routed = routeExtractionConfidence([
      { key: 'th', value: 14, confidence: 0.95 },
      { key: 'bk', value: 72, confidence: 0.4 },
    ]);
    expect(routed[0]?.needsConfirmation).toBe(false);
    expect(routed[1]?.needsConfirmation).toBe(true);
  });
});
