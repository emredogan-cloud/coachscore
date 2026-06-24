/**
 * Job definitions binding the durable runner to the real AI orchestrators.
 * These use the resilient + cached Anthropic provider (Phase 8) over the
 * durable async store (Postgres when activated, in-memory otherwise). The
 * runner's retry/idempotency/dead-letter semantics are unit-tested independently
 * with injected handlers + the memory async store.
 */

import { generateReportDraft } from '@/lib/ai/draft';
import { extractAccountFromScreenshots } from '@/lib/ai/ocr';
import { buildResilientProvider } from '@/lib/ai/provider';
import type {
  DraftInput,
  DraftResult,
  ExtractionResult,
  ProviderImage,
} from '@/lib/ai/types';
import { runDurableJob } from './durable-runner';
import type { AsyncQueueStore, JobOutcome } from './types';
import { resolveQueueStore } from './wire';

export function enqueueReportDraft(
  input: DraftInput,
  idempotencyKey: string,
  store: AsyncQueueStore = resolveQueueStore('report_draft'),
): Promise<JobOutcome<DraftResult>> {
  return runDurableJob(
    (i: DraftInput) =>
      generateReportDraft(i, { provider: buildResilientProvider() }),
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
  store: AsyncQueueStore = resolveQueueStore('extraction'),
): Promise<JobOutcome<ExtractionResult>> {
  return runDurableJob(
    (p: ExtractionPayload) =>
      extractAccountFromScreenshots(p.images, p.context, {
        provider: buildResilientProvider(),
      }),
    payload,
    { idempotencyKey },
    store,
  );
}
