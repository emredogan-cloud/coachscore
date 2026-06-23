import { describe, expect, it } from 'vitest';
import { computeCoachScore } from '@/lib/core';
import { createSnapshot } from '@/lib/snapshot';
import { assembleReport } from '@/lib/report';
import type { ReportDraft } from '@/lib/ai';
import { renderReportHtml, renderReportPdf } from '@/lib/pdf';
import { TH14_WAR_EXAMPLE } from '../core/fixtures';

const snapshot = createSnapshot({
  account: TH14_WAR_EXAMPLE,
  goal: 'war',
  provenance: {
    source: 'manual',
    confidence: 1,
    fieldsNeedingConfirmation: [],
  },
});
const score = computeCoachScore(TH14_WAR_EXAMPLE, 'war');
const report = assembleReport({ snapshot, score });

describe('renderReportPdf', () => {
  it('produces a valid, non-trivial PDF', async () => {
    const bytes = await renderReportPdf(report);
    expect(bytes.length).toBeGreaterThan(800);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
  });

  it('is deterministic (same report → identical bytes)', async () => {
    const a = await renderReportPdf(report);
    const b = await renderReportPdf(report);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
  });

  it('encodes AI-authored prose with non-WinAnsi characters without throwing', async () => {
    const draft: ReportDraft = {
      diagnosis:
        'Smart “quotes”, an em—dash, an arrow → and emoji 🎯 — all here.',
      roadmap: [],
      goalTips: ['Push your queen → war 3-stars.'],
    };
    const aiReport = assembleReport({ snapshot, score, draft });
    const bytes = await renderReportPdf(aiReport);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
  });
});

describe('renderReportHtml', () => {
  it('renders the key sections and the version footer', () => {
    const html = renderReportHtml(report);
    expect(html).toContain('CoachScore Report');
    expect(html).toContain('Upgrade roadmap');
    expect(html).toContain(report.version.composite);
    expect(html).toContain('not endorsed by Supercell');
  });

  it('HTML-escapes interpolated content', () => {
    const draft: ReportDraft = {
      diagnosis: 'Danger <script>alert(1)</script> & "quotes".',
      roadmap: [],
      goalTips: ['ok'],
    };
    const html = renderReportHtml(assembleReport({ snapshot, score, draft }));
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
