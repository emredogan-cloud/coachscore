/**
 * Job definitions binding the durable runner to the real AI orchestrators.
 * These use the production Anthropic provider; the runner's retry/idempotency/
 * dead-letter semantics are unit-tested independently with injected handlers.
 */

import { generateReportDraft } from '@/lib/ai/draft';
import { extractAccountFromScreenshots } from '@/lib/ai/ocr';
import { defaultProvider } from '@/lib/ai/provider';
import type {
  DraftInput,
  DraftResult,
  ExtractionResult,
  ProviderImage,
} from '@/lib/ai/types';
import { runJob } from './runner';
import type { JobOutcome, QueueStore } from './types';

export function enqueueReportDraft(
  input: DraftInput,
  idempotencyKey: string,
  store?: QueueStore,
): Promise<JobOutcome<DraftResult>> {
  return runJob(
    (i: DraftInput) => generateReportDraft(i, { provider: defaultProvider() }),
    input,
    { idempotencyKey },
    store,
  );
}

interface ExtractionPayload {
  readonly images: readonly ProviderImage[];
  readonly context: string;
}

export function enqueueExtraction(
  payload: ExtractionPayload,
  idempotencyKey: string,
  store?: QueueStore,
): Promise<JobOutcome<ExtractionResult>> {
  return runJob(
    (p: ExtractionPayload) =>
      extractAccountFromScreenshots(p.images, p.context, {
        provider: defaultProvider(),
      }),
    payload,
    { idempotencyKey },
    store,
  );
}
