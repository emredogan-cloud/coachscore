/**
 * Report-draft orchestrator (ADR 0005).
 *
 * Flow: build prompt → force structured tool output → schema-validate →
 * verify against the engine's gap list (anti-hallucination) → score confidence
 * → retry on failure (bounded) → flag for human review if exhausted or
 * low-confidence. The provider is injected so the production path uses real
 * Anthropic while logic is unit-tested deterministically.
 */

import { verifyDraftAgainstResult } from './anti-hallucination';
import { scoreDraftConfidence } from './confidence';
import {
  buildDraftMessages,
  DRAFT_SYSTEM_PROMPT,
  DRAFT_TOOL_NAME,
} from './prompts';
import { MODELS } from './provider';
import { referenceDataReadiness } from './readiness';
import { REPORT_DRAFT_TOOL_SCHEMA, ReportDraftSchema } from './schema';
import {
  CONFIDENCE_FLOOR,
  MAX_DRAFT_ATTEMPTS,
  type AiProvider,
  type DraftInput,
  type DraftResult,
  type ProviderUsage,
} from './types';

export interface DraftDeps {
  readonly provider: AiProvider;
}

const DRAFT_TOOL = {
  name: DRAFT_TOOL_NAME,
  description:
    'Emit the structured CoachScore report: diagnosis, prioritized roadmap ' +
    '(drawn only from the supplied gap list), and goal-specific tips.',
  inputSchema: REPORT_DRAFT_TOOL_SCHEMA,
};

export async function generateReportDraft(
  input: DraftInput,
  deps: DraftDeps,
): Promise<DraftResult> {
  const referenceData = referenceDataReadiness(input.townHall);

  // Maxed account: there is nothing to recommend — no AI roadmap needed.
  if (input.result.gaps.length === 0) {
    return {
      ok: true,
      draft: null,
      confidence: 1,
      needsHumanReview: false,
      flags: ['account-maxed: no roadmap required'],
      attempts: 0,
      referenceData,
      usage: null,
    };
  }

  const messages = buildDraftMessages(input);
  let attempts = 0;
  let lastFlags: string[] = [];
  let lastUsage: ProviderUsage | null = null;

  while (attempts < MAX_DRAFT_ATTEMPTS) {
    attempts += 1;
    const response = await deps.provider.generate({
      model: MODELS.reasoning(),
      system: DRAFT_SYSTEM_PROMPT,
      messages,
      maxTokens: 2048,
      tool: DRAFT_TOOL,
    });
    lastUsage = response.usage;

    const parsed = ReportDraftSchema.safeParse(response.toolInput);
    if (!parsed.success) {
      lastFlags = [`schema validation failed on attempt ${attempts}`];
      continue;
    }

    const verification = verifyDraftAgainstResult(parsed.data, input.result);
    if (!verification.ok) {
      lastFlags = verification.violations.map((v) => `hallucination: ${v}`);
      continue;
    }

    const confidence = scoreDraftConfidence(
      parsed.data,
      input.result,
      verification.proseWarnings.length,
    );

    return {
      ok: true,
      draft: parsed.data,
      confidence: confidence.score,
      needsHumanReview: confidence.score < CONFIDENCE_FLOOR,
      flags: [...confidence.flags, ...verification.proseWarnings],
      attempts,
      referenceData,
      usage: lastUsage,
    };
  }

  return {
    ok: false,
    draft: null,
    confidence: 0,
    needsHumanReview: true,
    flags: ['exhausted retries without a valid draft', ...lastFlags],
    attempts,
    referenceData,
    usage: lastUsage,
  };
}
