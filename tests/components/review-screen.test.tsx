import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { computeCoachScore } from '@/lib/core';
import { normalizeIntake } from '@/lib/intake';
import { ReviewScreen } from '@/components/intake/review-screen';
import type { IntakeResponseBody } from '@/lib/api';

const account = normalizeIntake({
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
});

const body: IntakeResponseBody = {
  ok: true,
  source: 'manual',
  score: computeCoachScore(account, 'war'),
  confidence: 0.9,
  fieldsNeedingConfirmation: ['hero:archerQueen'],
  referenceReady: false,
  snapshotHash: 'deadbeef',
  persistence: {
    attempted: false,
    persisted: false,
    reason: 'database_not_configured',
  },
};

describe('ReviewScreen', () => {
  it('renders the grade, persistence state and fields to confirm', () => {
    const html = renderToStaticMarkup(<ReviewScreen body={body} />);
    expect(html).toContain('Your CoachScore');
    expect(html).toContain('>A<'); // grade letter
    expect(html).toContain('database_not_configured');
    expect(html).toContain('hero:archerQueen');
    expect(html).toContain('Top upgrade priorities');
  });

  it('handles a missing score (gated path) gracefully', () => {
    const html = renderToStaticMarkup(
      <ReviewScreen
        body={{
          ok: false,
          source: 'tag',
          score: null,
          confidence: 0,
          fieldsNeedingConfirmation: [],
          referenceReady: false,
          snapshotHash: null,
          persistence: {
            attempted: false,
            persisted: false,
            reason: 'intake_failed',
          },
        }}
      />,
    );
    expect(html).toContain('needs activation');
  });
});
