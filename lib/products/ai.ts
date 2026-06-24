/**
 * Product AI enrichment (Phase 6). Reuses the Phase-2 Anthropic pipeline
 * (provider behind an interface, forced-tool structured output, Zod validation)
 * to add a tight summary + extra recommendations on top of the deterministic
 * engine output. Anti-hallucination: the model is told to ground everything in
 * the supplied analysis and never invent facts/numbers; on a schema mismatch we
 * fall back to the deterministic report. The provider is injected, so this is
 * unit-tested without a key.
 */

import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import { MODELS, type AiProvider } from '@/lib/ai';
import { PRODUCT_TITLES, type ProductAnalysis, type ProductSku } from './types';

export const ProductDraftSchema = z.object({
  summary: z.string().min(20),
  recommendations: z.array(z.string().min(5)).min(1).max(8),
});

function toToolSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  const json = zodToJsonSchema(schema, { $refStrategy: 'none' }) as Record<
    string,
    unknown
  >;
  delete json.$schema;
  return json;
}

const PRODUCT_DRAFT_TOOL = {
  name: 'emit_product_notes',
  description:
    'Emit a concise product summary and up to a few extra recommendations, ' +
    'grounded ONLY in the supplied analysis.',
  inputSchema: toToolSchema(ProductDraftSchema),
};

export interface ProductAiResult {
  readonly aiAuthored: boolean;
  readonly confidence: number;
  readonly extraRecommendations: readonly string[];
  readonly summary: string | null;
}

export interface ProductAiDeps {
  readonly provider: AiProvider;
}

export async function draftProductNotes(
  sku: ProductSku,
  analysis: ProductAnalysis,
  deps: ProductAiDeps,
): Promise<ProductAiResult> {
  const system = [
    `You are a Clash of Clans coach writing brief ${PRODUCT_TITLES[sku]} notes.`,
    'A deterministic engine already produced the analysis below. Do NOT invent',
    'new facts or numbers. Summarize it in one tight paragraph and add up to a',
    'few extra, specific recommendations that follow from the analysis.',
    'Return your answer ONLY by calling the provided tool.',
  ].join('\n');

  const content = [
    `Score: ${analysis.score ? `${analysis.score.label} ${analysis.score.value}/100` : 'n/a'}`,
    `Summary: ${analysis.summary}`,
    'Sections:',
    ...analysis.sections.map((s) => `- ${s.title}: ${s.items.join(' | ')}`),
    `Existing recommendations: ${analysis.recommendations.join(' | ')}`,
  ].join('\n');

  const response = await deps.provider.generate({
    model: MODELS.reasoning(),
    system,
    messages: [{ role: 'user' as const, content }],
    maxTokens: 800,
    tool: PRODUCT_DRAFT_TOOL,
  });

  const parsed = ProductDraftSchema.safeParse(response.toolInput);
  if (!parsed.success) {
    return {
      aiAuthored: false,
      confidence: 0.6,
      extraRecommendations: [],
      summary: null,
    };
  }
  return {
    aiAuthored: true,
    confidence: 0.9,
    extraRecommendations: parsed.data.recommendations.slice(0, 5),
    summary: parsed.data.summary,
  };
}
