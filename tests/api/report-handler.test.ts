import { describe, expect, it } from 'vitest';
import { handleReport, handleReportPdf } from '@/lib/api';
import type { IntakeFields } from '@/lib/intake';

const fields: IntakeFields = {
  townHall: 14,
  heroLevels: {
    barbarianKing: 72,
    archerQueen: 75,
    grandWarden: 48,
    royalChampion: 22,
  },
  offensePercent: 85,
  defensePercent: 82,
  progressionPercent: 93,
  walls: { atOrAboveThMax: 85, total: 100 },
  clan: {
    donationBehavior: 0.78,
    warContribution: 0.78,
    capitalContribution: 0.78,
    activitySignal: 0.78,
  },
};
const body = { goal: 'war', fields };

interface ReportBody {
  teaser: { grade: string };
  report: unknown | null;
  access: { full: boolean; reason: string };
}

describe('handleReport', () => {
  it('returns teaser only and gates the full report when not entitled', async () => {
    const res = await handleReport(body);
    expect(res.status).toBe(200);
    const b = res.body as ReportBody;
    expect(b.teaser.grade).toBe('A');
    expect(b.report).toBeNull();
    expect(b.access).toEqual({ full: false, reason: 'payments_not_activated' });
  });

  it('returns the full report in an explicit preview', async () => {
    const res = await handleReport({ ...body, preview: true });
    const b = res.body as ReportBody;
    expect(b.report).not.toBeNull();
    expect(b.access).toEqual({ full: true, reason: 'preview' });
  });

  it('returns the full report when entitled', async () => {
    const res = await handleReport(body, { isEntitled: () => true });
    const b = res.body as ReportBody;
    expect(b.report).not.toBeNull();
    expect(b.access.reason).toBe('entitled');
  });

  it('rejects an invalid body with 422', async () => {
    expect((await handleReport({ goal: 'nope', fields })).status).toBe(422);
  });
});

describe('handleReportPdf', () => {
  it('renders a PDF for a valid body', async () => {
    const result = await handleReportPdf(body);
    expect(result.status).toBe(200);
    expect(result.pdf).toBeDefined();
    if (result.pdf) {
      expect(new TextDecoder().decode(result.pdf.slice(0, 5))).toBe('%PDF-');
    }
  });

  it('returns 422 for an invalid body', async () => {
    const result = await handleReportPdf({ goal: 'nope' });
    expect(result.status).toBe(422);
    expect(result.pdf).toBeUndefined();
  });
});
