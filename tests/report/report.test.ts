import { describe, expect, it } from 'vitest';
import { computeCoachScore } from '@/lib/core';
import { createSnapshot } from '@/lib/snapshot';
import type { ReportDraft } from '@/lib/ai';
import {
  assembleReport,
  buildTeaser,
  deriveStrengths,
  deriveWeaknesses,
} from '@/lib/report';
import { TH14_WAR_EXAMPLE, TH16_MAXED } from '../core/fixtures';

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

describe('assembleReport (deterministic, no AI)', () => {
  const report = assembleReport({ snapshot, score });

  it('uses computed numbers and a deterministic diagnosis', () => {
    expect(report.aiAuthored).toBe(false);
    expect(report.confidence).toBe(1);
    expect(report.grade).toBe(score.grade);
    expect(report.overall).toBe(score.overallRounded);
    expect(report.diagnosis).toContain('war');
    expect(report.diagnosis).toContain(String(score.overallRounded));
  });

  it('locks a composite version derived from the snapshot', () => {
    expect(report.version.formatVersion).toBe('1.0.0');
    expect(report.version.snapshotHash).toBe(snapshot.snapshotHash);
    expect(report.version.composite).toContain('r1.0.0');
    expect(report.version.composite).toContain(
      snapshot.snapshotHash.slice(0, 12),
    );
  });

  it('builds a ranked roadmap from the gap list', () => {
    expect(report.roadmap.length).toBeGreaterThan(0);
    expect(report.roadmap[0]?.rank).toBe(1);
    expect(report.roadmap[0]?.estimatedImpact).toBe('high');
    expect(report.subScores).toHaveLength(7);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it('flags TH14 as not paid-ready (reference verification debt)', () => {
    expect(report.referenceReady).toBe(false);
  });
});

describe('assembleReport (AI-authored draft)', () => {
  it('uses the draft diagnosis, roadmap, and tips', () => {
    const topGap = score.gaps[0];
    if (!topGap) throw new Error('expected at least one gap');
    const draft: ReportDraft = {
      diagnosis: 'A custom coach diagnosis well over twenty characters long.',
      roadmap: [
        {
          rank: 1,
          elementId: topGap.id,
          fromLevel: topGap.level,
          toLevel: topGap.maxLevel,
          rationale: 'Because it matters most.',
          estimatedImpact: 'high',
        },
      ],
      goalTips: ['One specific tip.'],
    };
    const report = assembleReport({
      snapshot,
      score,
      draft,
      confidence: 0.8,
      needsHumanReview: true,
    });
    expect(report.aiAuthored).toBe(true);
    expect(report.diagnosis).toBe(draft.diagnosis);
    expect(report.roadmap[0]?.elementId).toBe(topGap.id);
    expect(report.roadmap[0]?.category).toBe(topGap.category);
    expect(report.recommendations).toEqual(['One specific tip.']);
    expect(report.confidence).toBe(0.8);
    expect(report.needsHumanReview).toBe(true);
  });
});

describe('strengths / weaknesses / teaser', () => {
  it('a maxed account is all strengths, no weaknesses', () => {
    const maxed = computeCoachScore(TH16_MAXED, 'progress');
    expect(deriveStrengths(maxed.subScores).length).toBeGreaterThan(0);
    expect(deriveWeaknesses(maxed.subScores)).toHaveLength(0);
  });

  it('teaser exposes grade + top weakness and locks premium sections', () => {
    const report = assembleReport({ snapshot, score });
    const teaser = buildTeaser(report);
    expect(teaser.headline).toContain('Grade');
    expect(teaser.topWeakness).toEqual(report.weaknesses[0] ?? null);
    expect(teaser.lockedSections.length).toBeGreaterThanOrEqual(3);
  });
});
