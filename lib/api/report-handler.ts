/**
 * Report + PDF handlers (Phase 4). Build a `RenderableReport` from a manual
 * intake body (credential-free), return the free teaser plus the full report
 * only when entitled (or in an explicitly-labeled preview), and render a
 * deterministic PDF. Entitlement is injectable; default is "not entitled" until
 * payments are activated.
 */

import { z } from 'zod';
import { intakeManual, ManualIntakeSchema } from '@/lib/intake';
import { scoreSnapshot } from '@/lib/snapshot';
import {
  assembleReport,
  buildTeaser,
  type RenderableReport,
  type ReportTeaser,
} from '@/lib/report';
import { renderReportPdf } from '@/lib/pdf';
import { errorToResult, ValidationError } from './errors';
import type { HandlerResult } from './intake-handler';

const ReportRequestSchema = ManualIntakeSchema.extend({
  preview: z.boolean().optional(),
});

interface BuiltReport {
  readonly report: RenderableReport;
  readonly teaser: ReportTeaser;
  readonly preview: boolean;
}

type BuildOutcome =
  | { readonly ok: true; readonly built: BuiltReport }
  | { readonly ok: false; readonly result: HandlerResult };

function buildFromBody(rawBody: unknown): BuildOutcome {
  const parsed = ReportRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return {
      ok: false,
      result: errorToResult(
        new ValidationError(
          'Invalid report request body.',
          parsed.error.flatten(),
        ),
      ),
    };
  }
  const intake = intakeManual({
    goal: parsed.data.goal,
    fields: parsed.data.fields,
  });
  if (!intake.ok || intake.snapshot === null) {
    return {
      ok: false,
      result: errorToResult(
        new ValidationError(intake.errors.join('; ') || 'Intake failed.'),
      ),
    };
  }
  const score = scoreSnapshot(intake.snapshot);
  const report = assembleReport({ snapshot: intake.snapshot, score });
  return {
    ok: true,
    built: {
      report,
      teaser: buildTeaser(report),
      preview: parsed.data.preview ?? false,
    },
  };
}

export interface ReportHandlerDeps {
  /** Whether the caller is entitled to the full report. Default: not entitled. */
  readonly isEntitled?: () => boolean | Promise<boolean>;
}

export async function handleReport(
  rawBody: unknown,
  deps: ReportHandlerDeps = {},
): Promise<HandlerResult> {
  const outcome = buildFromBody(rawBody);
  if (!outcome.ok) return outcome.result;

  const entitled = deps.isEntitled ? await deps.isEntitled() : false;
  const full = entitled || outcome.built.preview;
  const reason = entitled
    ? 'entitled'
    : outcome.built.preview
      ? 'preview'
      : 'payments_not_activated';

  return {
    status: 200,
    body: {
      teaser: outcome.built.teaser,
      report: full ? outcome.built.report : null,
      access: { full, reason },
    },
  };
}

export interface PdfResult {
  readonly status: number;
  readonly pdf?: Uint8Array;
  readonly body?: unknown;
}

export async function handleReportPdf(rawBody: unknown): Promise<PdfResult> {
  const outcome = buildFromBody(rawBody);
  if (!outcome.ok) {
    return { status: outcome.result.status, body: outcome.result.body };
  }
  return { status: 200, pdf: await renderReportPdf(outcome.built.report) };
}
