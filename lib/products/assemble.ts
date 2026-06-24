/**
 * Product report assembly (Phase 6). Dispatches to the per-SKU engine and wraps
 * the analysis into the uniform `ProductReportView` (versioned, optionally
 * AI-enriched). Pure.
 */

import { analyzeBase } from './base';
import { analyzeReplay } from './replay';
import { buildWarPlan } from './war';
import type { ProductInput } from './validation';
import {
  PRODUCT_REPORT_VERSION,
  PRODUCT_TITLES,
  type ProductAnalysis,
  type ProductReportView,
  type ProductSku,
} from './types';

export function analyzeProduct(request: ProductInput): ProductAnalysis {
  switch (request.sku) {
    case 'replay_doctor':
      return analyzeReplay(request.input);
    case 'base_doctor':
      return analyzeBase(request.input);
    case 'war_plan':
      return buildWarPlan(request.input);
  }
}

export interface AssembleProductInput {
  readonly sku: ProductSku;
  readonly analysis: ProductAnalysis;
  readonly confidence?: number;
  readonly aiAuthored?: boolean;
  /** Extra (AI-authored) recommendations appended to the deterministic ones. */
  readonly extraRecommendations?: readonly string[];
}

export function assembleProductReport(
  input: AssembleProductInput,
): ProductReportView {
  return {
    ...input.analysis,
    recommendations: [
      ...input.analysis.recommendations,
      ...(input.extraRecommendations ?? []),
    ],
    sku: input.sku,
    title: PRODUCT_TITLES[input.sku],
    version: `p${PRODUCT_REPORT_VERSION}+${input.sku}`,
    confidence: input.confidence ?? 1,
    aiAuthored: input.aiAuthored ?? false,
  };
}
