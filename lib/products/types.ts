/**
 * Additional-SKU product framework (Phase 6).
 *
 * ReplayDoctor, BaseDoctor, and WarPlan all produce a uniform `ProductReportView`
 * — a scored set of titled sections + recommendations — assembled
 * deterministically from a per-product engine, optionally enriched by AI. The
 * uniform shape lets one renderer, one persistence column, and one coach-review
 * path serve all three.
 */

export const PRODUCT_SKUS = [
  'replay_doctor',
  'base_doctor',
  'war_plan',
] as const;

export type ProductSku = (typeof PRODUCT_SKUS)[number];

export interface ProductScore {
  readonly label: string;
  readonly value: number;
}

export interface ProductSection {
  readonly key: string;
  readonly title: string;
  readonly items: readonly string[];
}

export interface ProductAnalysis {
  readonly score: ProductScore | null;
  readonly summary: string;
  readonly sections: readonly ProductSection[];
  readonly recommendations: readonly string[];
}

export interface ProductReportView extends ProductAnalysis {
  readonly sku: ProductSku;
  readonly title: string;
  readonly version: string;
  readonly confidence: number;
  readonly aiAuthored: boolean;
}

export const PRODUCT_REPORT_VERSION = '1.0.0';

export const PRODUCT_TITLES: Readonly<Record<ProductSku, string>> = {
  replay_doctor: 'ReplayDoctor',
  base_doctor: 'BaseDoctor',
  war_plan: 'WarPlan',
};
