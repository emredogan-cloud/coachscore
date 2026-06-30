import { DimensionBar } from '@/components/ui';
import { WEIGHT_PROFILES, type Goal, type SubScoreKey } from '@/lib/core';

/**
 * Score transparency (Phase E). A visual breakdown of how the CoachScore grade
 * is composed: the seven scored dimensions and their real weights, pulled live
 * from `lib/core` (never hardcoded). Each row is the premium `DimensionBar`
 * primitive whose track fill and gold label both show the true weight, so a
 * player can see *why* heroes/offense move their grade most. Hook-free,
 * server-renderable.
 */
const DIMENSIONS: readonly { key: SubScoreKey; label: string }[] = [
  { key: 'heroes', label: 'Heroes' },
  { key: 'offense', label: 'Offense' },
  { key: 'defense', label: 'Defense' },
  { key: 'equipment', label: 'Hero equipment' },
  { key: 'progression', label: 'Progression (rush)' },
  { key: 'walls', label: 'Walls' },
  { key: 'clanValue', label: 'Clan value' },
];

export function ScoreBreakdown({
  goal = 'progress',
  tier = 'th16plus',
}: {
  goal?: Goal;
  tier?: 'below16' | 'th16plus';
}) {
  const weights = WEIGHT_PROFILES[goal][tier];
  const rows = DIMENSIONS.map((d) => ({
    ...d,
    pct: Math.round((weights[d.key] ?? 0) * 100),
  })).sort((a, b) => b.pct - a.pct);

  return (
    <div
      className="space-y-3"
      role="img"
      aria-label={`Score weight breakdown for the ${goal} goal: ${rows
        .map((r) => `${r.label} ${r.pct} percent`)
        .join(', ')}`}
    >
      {rows.map((r) => (
        <DimensionBar key={r.key} label={r.label} percent={r.pct} />
      ))}
    </div>
  );
}
