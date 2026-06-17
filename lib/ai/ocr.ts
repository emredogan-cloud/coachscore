/**
 * Screenshot extraction (OCR) via the cheap/fast extraction model.
 *
 * Vision model reads visible levels and returns per-field confidence; fields
 * below the floor are routed to the user's confirmation screen (Phase 3). On a
 * schema-invalid response we degrade gracefully to an empty result so the
 * caller can fall back to the manual-entry path — never a dead end.
 */

import { routeExtractionConfidence } from './confidence';
import {
  buildExtractionMessages,
  EXTRACTION_SYSTEM_PROMPT,
  EXTRACTION_TOOL_NAME,
} from './prompts';
import { MODELS } from './provider';
import { EXTRACTION_TOOL_SCHEMA, ExtractionSchema } from './schema';
import type { AiProvider, ExtractionResult, ProviderImage } from './types';

export interface OcrDeps {
  readonly provider: AiProvider;
}

const EXTRACTION_TOOL = {
  name: EXTRACTION_TOOL_NAME,
  description:
    'Emit the visible account fields as {key, value, confidence in [0,1]}.',
  inputSchema: EXTRACTION_TOOL_SCHEMA,
};

export async function extractAccountFromScreenshots(
  images: readonly ProviderImage[],
  context: string,
  deps: OcrDeps,
): Promise<ExtractionResult> {
  const response = await deps.provider.generate({
    model: MODELS.extraction(),
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: buildExtractionMessages(context),
    maxTokens: 1536,
    tool: EXTRACTION_TOOL,
    images,
  });

  const parsed = ExtractionSchema.safeParse(response.toolInput);
  if (!parsed.success) {
    // Graceful degrade → caller routes to manual entry.
    return { fields: [], lowConfidence: [], usage: response.usage };
  }

  const fields = routeExtractionConfidence(parsed.data.fields);
  return {
    fields,
    lowConfidence: fields.filter((f) => f.needsConfirmation),
    usage: response.usage,
  };
}
