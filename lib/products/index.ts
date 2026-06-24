export * from './types';
export {
  PRODUCT_CATALOG,
  PRODUCT_LIST,
  getProduct,
  formatProductPrice,
  type ProductTier,
} from './catalog';
export { analyzeReplay, type ReplayInput, type ReplayTroop } from './replay';
export { analyzeBase, type BaseInput, type BaseCoreBuilding } from './base';
export { buildWarPlan, type WarInput, type WarRoster } from './war';
export {
  ProductSkuSchema,
  ReplayInputSchema,
  BaseInputSchema,
  WarInputSchema,
  ProductSubmissionSchema,
  parseProductInput,
  type ProductInput,
  type ProductInputParse,
} from './validation';
export {
  analyzeProduct,
  assembleProductReport,
  type AssembleProductInput,
} from './assemble';
export { renderProductReportHtml } from './render';
export {
  draftProductNotes,
  ProductDraftSchema,
  type ProductAiResult,
  type ProductAiDeps,
} from './ai';
export { runProductAnalysis, type ProductPipelineDeps } from './pipeline';
export {
  ProductService,
  ProductServiceError,
  type SaveProductReportInput,
  type SavedProductReport,
} from './service';
