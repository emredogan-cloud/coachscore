import { WEIGHT_PROFILES, type Goal, type SubScoreKey } from '@/lib/core';

/**
 * Score transparency (Phase E). A visual breakdown of how the CoachScore grade
 * is composed: the seven scored dimensions and their real weights, pulled live
 * from `lib/core` (never hardcoded). Bars are scaled to the heaviest dimension
 * for a clear visual hierarchy while the label shows the true percentage —
 * so a player can see *why* heroes/offense move their grade most. Hook-free,
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
  const maxPct = Math.max(...rows.map((r) => r.pct), 1);

  return (
    <div
      className="space-y-2.5"
      role="img"
      aria-label={`Score weight breakdown for the ${goal} goal: ${rows
        .map((r) => `${r.label} ${r.pct} percent`)
        .join(', ')}`}
    >
      {rows.map((r) => (
        <div key={r.key}>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-[var(--fg)]/90">{r.label}</span>
            <span className="font-semibold text-gold-gradient">{r.pct}%</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-violet-gradient"
              style={{ width: `${Math.round((r.pct / maxPct) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
