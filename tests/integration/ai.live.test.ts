import { describe, expect, it } from 'vitest';
import { computeCoachScore } from '@/lib/core';
import {
  defaultProvider,
  generateReportDraft,
  knowledgeBaseFor,
} from '@/lib/ai';
import { TH14_WAR_EXAMPLE } from '../core/fixtures';

const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);

// Self-skips when no key is configured (e.g. public CI). Runs for real locally.
describe.skipIf(!hasKey)('AI pipeline — LIVE Anthropic integration', () => {
  it('produces a schema-valid, hallucination-clean draft from a real call', async () => {
    const result = computeCoachScore(TH14_WAR_EXAMPLE, 'war');
    const out = await generateReportDraft(
      {
        townHall: 14,
        goal: 'war',
        result,
        knowledgeBase: knowledgeBaseFor(14),
        userFrustration: 'My queen charge keeps stalling in war.',
      },
      { provider: defaultProvider() },
    );

    expect(out.ok).toBe(true);
    const draft = out.draft;
    expect(draft).not.toBeNull();
    if (!draft) return;

    expect(draft.diagnosis.length).toBeGreaterThan(20);
    expect(draft.roadmap.length).toBeGreaterThan(0);

    // The real model's roadmap must reference only real gaps (no invented stats).
    const gapIds = new Set(result.gaps.map((g) => g.id));
    for (const item of draft.roadmap) {
      expect(gapIds.has(item.elementId)).toBe(true);
    }

    expect(out.usage?.outputTokens ?? 0).toBeGreaterThan(0);
  });
});
