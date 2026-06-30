import type { ReactNode } from 'react';

/**
 * Labelled progress bar for a scored dimension (Phase 2) — icon + label on the
 * left, gold percentage on the right, a violet progress track below. Used by the
 * report breakdown, methodology, and guide dimension grids. Pure + a11y.
 */
export function DimensionBar({
  label,
  percent,
  icon,
  className = '',
}: {
  label: string;
  percent: number;
  icon?: ReactNode;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-white/90">
          {icon ? (
            <span className="text-brand-violet-light">{icon}</span>
          ) : null}
          {label}
        </span>
        <span className="text-sm font-bold text-brand-gold tabular-nums">
          {pct}%
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-white/8"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-violet-gradient transition-[width] duration-700 ease-settle"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
