import { describe, expect, it } from 'vitest';
import { buildReminder, nextReScoreNudge } from '@/lib/retention';

const NOW = Date.parse('2026-06-29T00:00:00.000Z');

describe('nextReScoreNudge', () => {
  it('references the top upgrade when known', () => {
    const n = nextReScoreNudge({
      townHall: 16,
      topUpgradeLabel: 'Archer Queen',
      nowMs: NOW,
    });
    expect(n.reason).toBe('top_upgrade');
    expect(n.message).toContain('Archer Queen');
    expect(n.dueInDays).toBe(10); // TH16+ cadence
  });

  it('falls back to a periodic nudge without a label', () => {
    const n = nextReScoreNudge({ townHall: 12, nowMs: NOW });
    expect(n.reason).toBe('periodic');
    expect(n.dueInDays).toBe(5);
    expect(n.dueAtIso).toBe(new Date(NOW + 5 * 86_400_000).toISOString());
  });

  it('defers timing (null dueAt) when no clock is given', () => {
    expect(nextReScoreNudge({ townHall: 14 }).dueAtIso).toBeNull();
  });
});

describe('buildReminder', () => {
  it('produces a scheduled (never sent) reminder with a concrete due date', () => {
    const r = buildReminder({
      subjectId: 'anon-1',
      snapshotHash: 'abc',
      townHall: 17,
      grade: 'B',
      topUpgradeLabel: 'Grand Warden',
      nowMs: NOW,
    });
    expect(r.status).toBe('scheduled');
    expect(r.channel).toBe('none');
    expect(r.dueAtIso).toBe(new Date(NOW + 10 * 86_400_000).toISOString()); // TH16+ cadence
    expect(r.message).toContain('Grand Warden');
  });
});
