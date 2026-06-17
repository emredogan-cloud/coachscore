import { describe, expect, it } from 'vitest';
import { computeCoachScore, type Goal } from '@/lib/core';
import { generateReportDraft, knowledgeBaseFor } from '@/lib/ai';
import type { DraftInput } from '@/lib/ai';
import { TH16_MAXED } from '../core/fixtures';
import {
  StubProvider,
  th14WarResult,
  toolResponse,
  validDraftFor,
} from './helpers';

function draftInput(): DraftInput {
  const result = th14WarResult();
  return {
    townHall: 14,
    goal: 'war',
    result,
    userFrustration: 'My queen charges keep stalling.',
    knowledgeBase: knowledgeBaseFor(14),
  };
}

describe('generateReportDraft', () => {
  it('returns a validated, hallucination-clean draft on the first attempt', async () => {
    const input = draftInput();
    const provider = new StubProvider([
      toolResponse(validDraftFor(input.result)),
    ]);
    const out = await generateReportDraft(input, { provider });

    expect(out.ok).toBe(true);
    expect(out.attempts).toBe(1);
    expect(out.draft).not.toBeNull();
    expect(out.draft?.roadmap.length).toBeGreaterThan(0);
    expect(out.needsHumanReview).toBe(false);
    expect(out.confidence).toBeGreaterThanOrEqual(0.6);
  });

  it('retries on a schema-invalid response, then succeeds', async () => {
    const input = draftInput();
    const provider = new StubProvider([
      toolResponse({ diagnosis: 'too short', roadmap: [] }), // invalid
      toolResponse(validDraftFor(input.result)), // valid
    ]);
    const out = await generateReportDraft(input, { provider });
    expect(out.ok).toBe(true);
    expect(out.attempts).toBe(2);
  });

  it('retries when the roadmap hallucinates an element, then succeeds', async () => {
    const input = draftInput();
    const hallucinated = {
      diagnosis:
        'Upgrade the imaginary super-cannon to fix everything immediately now.',
      roadmap: [
        {
          rank: 1,
          elementId: 'super-cannon-9000', // not in the gap list
          fromLevel: 1,
          toLevel: 2,
          rationale: 'This element does not exist in the account.',
          estimatedImpact: 'high',
        },
      ],
      goalTips: ['tip'],
    };
    const provider = new StubProvider([
      toolResponse(hallucinated),
      toolResponse(validDraftFor(input.result)),
    ]);
    const out = await generateReportDraft(input, { provider });
    expect(out.ok).toBe(true);
    expect(out.attempts).toBe(2);
    expect(
      out.draft?.roadmap.every((r) => r.elementId !== 'super-cannon-9000'),
    ).toBe(true);
  });

  it('flags for human review after exhausting retries', async () => {
    const input = draftInput();
    const provider = new StubProvider([toolResponse({ nonsense: true })]);
    const out = await generateReportDraft(input, { provider });
    expect(out.ok).toBe(false);
    expect(out.draft).toBeNull();
    expect(out.needsHumanReview).toBe(true);
    expect(out.attempts).toBe(3);
    expect(provider.calls).toBe(3);
  });

  it('skips the model entirely for a maxed account (no gaps)', async () => {
    const result = computeCoachScore(TH16_MAXED, 'progress' as Goal);
    const provider = new StubProvider([toolResponse({})]);
    const out = await generateReportDraft(
      { townHall: 16, goal: 'progress', result, knowledgeBase: '' },
      { provider },
    );
    expect(out.ok).toBe(true);
    expect(out.draft).toBeNull();
    expect(provider.calls).toBe(0); // never called the model
    expect(out.flags.join(' ')).toContain('maxed');
  });

  it('reports reference-data readiness on the result', async () => {
    const input = draftInput();
    const provider = new StubProvider([
      toolResponse(validDraftFor(input.result)),
    ]);
    const out = await generateReportDraft(input, { provider });
    // TH14 still has category verification debt → not paid-ready.
    expect(out.referenceData.ready).toBe(false);
    expect(out.referenceData.unverifiedCount).toBeGreaterThan(0);
  });
});
