import { computeCoachScore } from '@/lib/core';
import type { CoachScoreResult } from '@/lib/core';
import type { AiProvider, ProviderResponse } from '@/lib/ai';
import { TH14_WAR_EXAMPLE } from '../core/fixtures';

/**
 * A test-only provider implementing the REAL AiProvider interface, returning
 * scripted responses. This is dependency injection for control-flow tests — the
 * production provider (AnthropicProvider) is the real integration; nothing here
 * fakes a Claude call in production code.
 */
export class StubProvider implements AiProvider {
  public calls = 0;
  constructor(private readonly responses: readonly ProviderResponse[]) {}

  async generate(): Promise<ProviderResponse> {
    const idx = Math.min(this.calls, this.responses.length - 1);
    this.calls += 1;
    const response = this.responses[idx];
    if (!response) {
      throw new Error('StubProvider: no scripted response');
    }
    return response;
  }
}

export function toolResponse(toolInput: unknown): ProviderResponse {
  return {
    text: '',
    toolInput,
    stopReason: 'tool_use',
    usage: { inputTokens: 100, outputTokens: 200 },
  };
}

/** The deterministic engine result for the TH14 war example (has gaps). */
export function th14WarResult(): CoachScoreResult {
  return computeCoachScore(TH14_WAR_EXAMPLE, 'war');
}

/** Build a schema-valid, hallucination-clean draft covering the top gaps. */
export function validDraftFor(result: CoachScoreResult): unknown {
  return {
    diagnosis:
      'Strong war account, but your heroes lag your Town Hall — the Royal ' +
      'Champion and Grand Warden are the bottleneck for converting two-stars ' +
      'into three-stars. Close those first.',
    roadmap: result.gaps.slice(0, 5).map((g, i) => ({
      rank: i + 1,
      elementId: g.id,
      fromLevel: g.level,
      toLevel: g.maxLevel,
      rationale: 'Closing this gap raises your goal-relevant performance.',
      estimatedImpact: 'high',
    })),
    goalTips: ['Practice your meta army in friendly challenges before war.'],
  };
}
