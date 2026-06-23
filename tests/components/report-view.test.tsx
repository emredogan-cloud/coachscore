import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { computeCoachScore } from '@/lib/core';
import { createSnapshot } from '@/lib/snapshot';
import { assembleReport, buildTeaser } from '@/lib/report';
import { ReportView } from '@/components/report/report-view';
import { TeaserView } from '@/components/report/teaser-view';
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
const report = assembleReport({
  snapshot,
  score: computeCoachScore(TH14_WAR_EXAMPLE, 'war'),
});

describe('ReportView', () => {
  it('renders diagnosis, roadmap, indicators, and version', () => {
    const html = renderToStaticMarkup(<ReportView report={report} />);
    expect(html).toContain('CoachScore Report');
    expect(html).toContain('Diagnosis');
    expect(html).toContain('Upgrade roadmap');
    expect(html).toContain('Reference verified for paid use');
    expect(html).toContain(report.version.composite);
  });
});

describe('TeaserView', () => {
  it('reveals the grade and lists locked premium sections', () => {
    const html = renderToStaticMarkup(
      <TeaserView teaser={buildTeaser(report)} />,
    );
    expect(html).toContain(report.grade);
    expect(html).toContain('Unlock the full report');
    expect(html).toContain('Printable PDF report');
  });
});
