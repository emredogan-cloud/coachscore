/**
 * Circular score gauge (0–100) with a violet→gold gradient stroke — the premium
 * replacement for a bare number. Pure SVG, hook-free, server-rendered, a11y-labelled.
 */
export function ScoreRing({
  value,
  size = 132,
  stroke = 10,
  label,
  grade,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  grade?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped / 100);
  return (
    <div
      className="relative inline-flex items-center justify-center"
      role="img"
      aria-label={`${label ?? 'Score'}: ${clamped} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="score-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#e8b339" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#score-ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-extrabold text-white">{clamped}</span>
        <span className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
          {grade ? grade : '/ 100'}
        </span>
      </div>
    </div>
  );
}
