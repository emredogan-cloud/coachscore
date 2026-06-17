import { describe, expect, it } from 'vitest';
import { verifyDraftAgainstResult } from '@/lib/ai';
import type { ReportDraft } from '@/lib/ai';
import { th14WarResult, validDraftFor } from './helpers';

describe('verifyDraftAgainstResult', () => {
  const result = th14WarResult();

  it('accepts a roadmap drawn from the gap list with exact levels', () => {
    const draft = validDraftFor(result) as ReportDraft;
    const v = verifyDraftAgainstResult(draft, result);
    expect(v.ok).toBe(true);
    expect(v.violations).toEqual([]);
  });

  it('rejects an unknown element id', () => {
    const draft: ReportDraft = {
      diagnosis: 'A long enough diagnosis string for the schema to accept it.',
      roadmap: [
        {
          rank: 1,
          elementId: 'nonexistent-thing',
          fromLevel: 1,
          toLevel: 2,
          rationale: 'invented element',
          estimatedImpact: 'high',
        },
      ],
      goalTips: ['tip'],
    };
    const v = verifyDraftAgainstResult(draft, result);
    expect(v.ok).toBe(false);
    expect(v.violations.some((x) => x.includes('unknown elementId'))).toBe(
      true,
    );
  });

  it('rejects altered from/to levels (no invented stats)', () => {
    const gap = result.gaps[0];
    if (!gap) throw new Error('expected at least one gap');
    const draft: ReportDraft = {
      diagnosis: 'A long enough diagnosis string for the schema to accept it.',
      roadmap: [
        {
          rank: 1,
          elementId: gap.id,
          fromLevel: gap.level + 5, // tampered
          toLevel: gap.maxLevel,
          rationale: 'wrong starting level',
          estimatedImpact: 'high',
        },
      ],
      goalTips: ['tip'],
    };
    const v = verifyDraftAgainstResult(draft, result);
    expect(v.ok).toBe(false);
    expect(v.violations.some((x) => x.includes('fromLevel'))).toBe(true);
  });

  it('emits a soft prose warning for an untraceable number', () => {
    const gap = result.gaps[0];
    if (!gap) throw new Error('expected at least one gap');
    const draft: ReportDraft = {
      diagnosis: 'Your win rate is exactly 4242 percent which is impossible.',
      roadmap: [
        {
          rank: 1,
          elementId: gap.id,
          fromLevel: gap.level,
          toLevel: gap.maxLevel,
          rationale: 'valid item',
          estimatedImpact: 'high',
        },
      ],
      goalTips: ['tip'],
    };
    const v = verifyDraftAgainstResult(draft, result);
    expect(v.ok).toBe(true); // structured roadmap is valid
    expect(v.proseWarnings.some((w) => w.includes('4242'))).toBe(true);
  });
});
