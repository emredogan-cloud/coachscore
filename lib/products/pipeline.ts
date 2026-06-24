/**
 * Product analysis pipeline (Phase 6). Composes the deterministic per-SKU engine
 * with optional AI enrichment into the uniform `ProductReportView`.
 *
 * This is the credential-free core: with no provider (AI not activated) or on any
 * AI failure it returns the fully-grounded deterministic report. AI only ever
 * *adds* a confidence signal + extra recommendations on top — it never blocks the
 * report and never replaces the deterministic, grounded analysis.
 */

import type { AiProvider } from '@/lib/ai';
import { draftProductNotes } from './ai';
import { analyzeProduct, assembleProductReport } from './assemble';
import type { ProductReportView } from './types';
import type { ProductInput } from './validation';

export interface ProductPipelineDeps {
  /** When omitted, the report is deterministic-only (AI not activated). */
  readonly provider?: AiProvider;
}

export async function runProductAnalysis(
  request: ProductInput,
  deps: ProductPipelineDeps = {},
): Promise<ProductReportView> {
  const analysis = analyzeProduct(request);
  if (!deps.provider) {
    return assembleProductReport({ sku: request.sku, analysis });
  }
  try {
    const ai = await draftProductNotes(request.sku, analysis, {
      provider: deps.provider,
    });
    return assembleProductReport({
      sku: request.sku,
      analysis,
      confidence: ai.confidence,
      aiAuthored: ai.aiAuthored,
      extraRecommendations: ai.extraRecommendations,
    });
  } catch {
    // AI unavailable/transient — the deterministic report stands on its own.
    return assembleProductReport({ sku: request.sku, analysis });
  }
}
