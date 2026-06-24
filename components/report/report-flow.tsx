'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Goal } from '@/lib/core';
import type { RenderableReport, ReportTeaser } from '@/lib/report';
import { requestReport } from '@/app/report/actions';
import { ManualEntryForm } from '@/components/intake/manual-entry-form';
import { ReportView } from './report-view';
import { TeaserView } from './teaser-view';

interface ReportResponse {
  teaser: ReportTeaser;
  report: RenderableReport | null;
  access: { full: boolean; reason: string };
}

const btn =
  'rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-violet-gradient dark:text-white';
const link =
  'rounded border border-gray-300 px-4 py-2 text-sm dark:border-gray-700';

/**
 * Teaser → full-report funnel (Phase 4). Enter levels → free teaser with locked
 * sections → preview the full report, download the PDF, share, or go to pricing.
 */
export function ReportFlow() {
  const [goal, setGoal] = useState<Goal>('rate');
  const [lastBody, setLastBody] = useState<Record<string, unknown> | null>(
    null,
  );
  const [data, setData] = useState<ReportResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(body: Record<string, unknown>) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await requestReport(body);
      if (res.status === 200) {
        setData(res.body as ReportResponse);
      } else {
        const b = res.body as { error?: { message?: string } };
        setError(b.error?.message ?? `Request failed (${res.status}).`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setSubmitting(false);
    }
  }

  function onSubmit(body: unknown) {
    const b = body as Record<string, unknown>;
    setLastBody(b);
    void run(b);
  }

  function previewFull() {
    if (lastBody !== null) void run({ ...lastBody, preview: true });
  }

  async function downloadPdf() {
    if (lastBody === null) return;
    const res = await fetch('/api/report/pdf', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(lastBody),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'coachscore-report.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (data === null) {
    return (
      <div className="space-y-4">
        {error !== null ? (
          <p
            role="alert"
            className="rounded bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950/40"
          >
            {error}
          </p>
        ) : null}
        <ManualEntryForm
          goal={goal}
          onGoalChange={setGoal}
          onSubmit={onSubmit}
          submitting={submitting}
        />
      </div>
    );
  }

  const shareHref =
    `/api/share/og?grade=${data.teaser.grade}&overall=${data.teaser.overall}` +
    `&th=${data.teaser.townHall}&goal=${data.teaser.goal}`;

  return (
    <div className="space-y-6">
      {data.report !== null ? (
        <ReportView report={data.report} />
      ) : (
        <TeaserView teaser={data.teaser} />
      )}

      <div className="flex flex-wrap gap-3">
        {data.report === null ? (
          <button
            type="button"
            onClick={previewFull}
            disabled={submitting}
            className={btn}
          >
            Preview full report
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void downloadPdf()}
            className={btn}
          >
            Download PDF
          </button>
        )}
        <Link href="/pricing" className={link}>
          See pricing
        </Link>
        <a href={shareHref} target="_blank" rel="noreferrer" className={link}>
          Share card
        </a>
        <button
          type="button"
          onClick={() => {
            setData(null);
            setLastBody(null);
            setError(null);
          }}
          className="text-sm text-gray-500 underline"
        >
          Start over
        </button>
      </div>

      {data.report !== null && data.access.reason === 'preview' ? (
        <p className="text-xs text-amber-600">
          Preview — shown for demonstration. Payments are not activated, so no
          purchase was made.
        </p>
      ) : null}
    </div>
  );
}
