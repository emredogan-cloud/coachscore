/**
 * Letter-grade badge (Phase 2) — the grade in a shield-tinted chip colored by
 * its band, matching the on-site grade scale (S gold · A green · B lime ·
 * C yellow · D orange · E/F red). Pure + server-rendered + a11y-labelled.
 */
const BAND: Record<string, { text: string; ring: string; glow: string }> = {
  S: {
    text: 'text-brand-gold',
    ring: 'border-brand-gold/60',
    glow: 'shadow-glow-gold-sm',
  },
  A: { text: 'text-grade-a', ring: 'border-grade-a/55', glow: '' },
  B: { text: 'text-grade-b', ring: 'border-grade-b/55', glow: '' },
  C: { text: 'text-grade-c', ring: 'border-grade-c/55', glow: '' },
  D: { text: 'text-grade-d', ring: 'border-grade-d/55', glow: '' },
  E: { text: 'text-grade-f', ring: 'border-grade-f/55', glow: '' },
  F: { text: 'text-grade-f', ring: 'border-grade-f/55', glow: '' },
};

const DEFAULT_BAND = {
  text: 'text-grade-c',
  ring: 'border-grade-c/55',
  glow: '',
};

const SIZES = {
  sm: 'h-10 w-10 text-xl',
  md: 'h-14 w-14 text-3xl',
  lg: 'h-20 w-20 text-5xl',
} as const;

export function GradeBadge({
  grade,
  size = 'md',
  className = '',
}: {
  grade: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const g = grade.toUpperCase();
  const band = BAND[g] ?? DEFAULT_BAND;
  return (
    <span
      role="img"
      aria-label={`Grade ${g}`}
      className={`inline-flex items-center justify-center rounded-2xl border bg-white/[0.03] font-extrabold ${band.text} ${band.ring} ${band.glow} ${SIZES[size]} ${className}`}
    >
      {g}
    </span>
  );
}
