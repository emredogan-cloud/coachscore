/**
 * Report + PDF handlers.
 *
 * The primary "magic moment" path is by player TAG: we fetch the account from
 * the official API (objective, zero user input), score it, and return the free
 * teaser + the full report when entitled. A MANUAL path remains as the fallback
 * (and for accounts we can't read), building from typed fields. Both share the
 * snapshot → score → assemble tail. Entitlement is injectable; default is "not
 * entitled" until payments are activated. PDF render is deterministic.
 */

import { z } from 'zod';
import { scoreSnapshot, type AccountSnapshot } from '@/lib/snapshot';
import {
  intakeByTag,
  intakeManual,
  ManualIntakeSchema,
  TagIntakeSchema,
} from '@/lib/intake';
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

const TagReportRequestSchema = TagIntakeSchema.extend({
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

/** Shared tail: score a captured snapshot and assemble the renderable report. */
function buildReportFromSnapshot(
  snapshot: AccountSnapshot,
  preview: boolean,
): BuiltReport {
  const score = scoreSnapshot(snapshot);
  const report = assembleReport({ snapshot, score });
  return { report, teaser: buildTeaser(report), preview };
}

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
  return {
    ok: true,
    built: buildReportFromSnapshot(
      intake.snapshot,
      parsed.data.preview ?? false,
    ),
  };
}

export interface ReportHandlerDeps {
  /** Whether the caller is entitled to the full report. Default: not entitled. */
  readonly isEntitled?: () => boolean | Promise<boolean>;
}

/** Resolve full-report access + the reason string from entitlement + preview. */
async function resolveAccess(
  built: BuiltReport,
  deps: ReportHandlerDeps,
): Promise<{ full: boolean; reason: string }> {
  const entitled = deps.isEntitled ? await deps.isEntitled() : false;
  const full = entitled || built.preview;
  const reason = entitled
    ? 'entitled'
    : built.preview
      ? 'preview'
      : 'payments_not_activated';
  return { full, reason };
}

export async function handleReport(
  rawBody: unknown,
  deps: ReportHandlerDeps = {},
): Promise<HandlerResult> {
  const outcome = buildFromBody(rawBody);
  if (!outcome.ok) return outcome.result;

  const access = await resolveAccess(outcome.built, deps);
  return {
    status: 200,
    body: {
      source: 'manual',
      teaser: outcome.built.teaser,
      report: access.full ? outcome.built.report : null,
      access,
    },
  };
}

/**
 * The tag-first report path: fetch the account from the official API and build
 * the report. When the API is not activated/reachable, returns a
 * `fallbackToManual` envelope so the UI offers manual entry (the brief: "if the
 * API cannot be reached, offer manual mode; otherwise never show it first").
 */
export async function handleReportByTag(
  rawBody: unknown,
  deps: ReportHandlerDeps = {},
): Promise<HandlerResult> {
  const parsed = TagReportRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorToResult(
      new ValidationError('Invalid tag report body.', parsed.error.flatten()),
    );
  }

  const intake = await intakeByTag(parsed.data.playerTag, parsed.data.goal);

  if (intake.notActivated) {
    return {
      status: 200,
      body: {
        fallbackToManual: true,
        reason: 'coc_api_not_activated',
        message:
          'Automatic lookup is not available right now — enter your details manually.',
      },
    };
  }
  if (!intake.ok || intake.snapshot === null) {
    return errorToResult(
      new ValidationError(
        intake.errors[0] ?? 'We could not read that player tag.',
      ),
    );
  }

  const built = buildReportFromSnapshot(
    intake.snapshot,
    parsed.data.preview ?? false,
  );
  const access = await resolveAccess(built, deps);
  return {
    status: 200,
    body: {
      source: 'tag',
      playerTag: parsed.data.playerTag,
      teaser: built.teaser,
      report: access.full ? built.report : null,
      access,
      confidence: intake.confidence,
      fieldsNeedingConfirmation: intake.fieldsNeedingConfirmation,
      referenceReady: intake.referenceReady,
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
