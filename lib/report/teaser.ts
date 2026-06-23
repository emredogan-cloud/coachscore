/**
 * Free-teaser construction (Phase 4). The teaser proves value — grade, overall
 * score, and the single top weakness — while listing the premium sections that
 * are locked until purchase. Pure.
 */

import type { RenderableReport, ReportTeaser } from './types';

export const LOCKED_SECTIONS: readonly string[] = [
  'Full prioritized upgrade roadmap',
  'All seven sub-scores',
  'Coach diagnosis & recommendations',
  'Printable PDF report',
  'Shareable result card',
];

export function buildTeaser(report: RenderableReport): ReportTeaser {
  return {
    grade: report.grade,
    overall: report.overall,
    townHall: report.townHall,
    goal: report.goal,
    rushLabel: report.rushLabel,
    headline: `Town Hall ${report.townHall} · Grade ${report.grade} (${report.overall}/100)`,
    topWeakness: report.weaknesses[0] ?? null,
    lockedSections: LOCKED_SECTIONS,
  };
}
