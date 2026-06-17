/**
 * Zod schemas for AI outputs (ADR 0005). Every model response is validated
 * against these before assembly; on mismatch the orchestrator retries, then
 * flags for human review. The same schemas back the forced-tool input schemas
 * sent to the model, so the model is steered to the exact shape we validate.
 */

import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

export const RoadmapItemSchema = z.object({
  rank: z.number().int().positive(),
  elementId: z.string().min(1),
  fromLevel: z.number().int().nonnegative(),
  toLevel: z.number().int().positive(),
  rationale: z.string().min(10),
  estimatedImpact: z.enum(['low', 'medium', 'high']),
});

export const ReportDraftSchema = z.object({
  diagnosis: z.string().min(20),
  roadmap: z.array(RoadmapItemSchema).min(1).max(15),
  goalTips: z.array(z.string().min(3)).min(1).max(8),
});

export const ExtractedFieldSchema = z.object({
  key: z.string().min(1),
  value: z.number().nonnegative(),
  confidence: z.number().min(0).max(1),
});

export const ExtractionSchema = z.object({
  fields: z.array(ExtractedFieldSchema).min(1),
});

export type ReportDraftParsed = z.infer<typeof ReportDraftSchema>;
export type ExtractionParsed = z.infer<typeof ExtractionSchema>;

/**
 * JSON-schema form for the forced-tool input. Anthropic requires JSON Schema
 * (draft 2020-12 compatible), so we use the standard json-schema output with
 * refs inlined (no $ref, no OpenAPI-only keywords) and drop the $schema header.
 */
function toToolSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  const json = zodToJsonSchema(schema, { $refStrategy: 'none' }) as Record<
    string,
    unknown
  >;
  delete json.$schema;
  return json;
}

export const REPORT_DRAFT_TOOL_SCHEMA = toToolSchema(ReportDraftSchema);
export const EXTRACTION_TOOL_SCHEMA = toToolSchema(ExtractionSchema);
