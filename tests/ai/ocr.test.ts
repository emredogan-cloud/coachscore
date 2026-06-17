import { describe, expect, it } from 'vitest';
import { extractAccountFromScreenshots } from '@/lib/ai';
import { StubProvider, toolResponse } from './helpers';

describe('extractAccountFromScreenshots', () => {
  it('routes low-confidence fields to confirmation', async () => {
    const provider = new StubProvider([
      toolResponse({
        fields: [
          { key: 'townHall', value: 14, confidence: 0.98 },
          { key: 'barbarianKing', value: 72, confidence: 0.35 },
        ],
      }),
    ]);
    const out = await extractAccountFromScreenshots([], 'context', {
      provider,
    });
    expect(out.fields).toHaveLength(2);
    expect(out.lowConfidence.map((f) => f.key)).toEqual(['barbarianKing']);
  });

  it('degrades gracefully to empty on a schema-invalid response', async () => {
    const provider = new StubProvider([toolResponse({ not: 'valid' })]);
    const out = await extractAccountFromScreenshots([], 'context', {
      provider,
    });
    expect(out.fields).toEqual([]);
    expect(out.lowConfidence).toEqual([]);
  });
});
