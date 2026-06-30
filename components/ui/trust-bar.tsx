import type { ReactNode } from 'react';

export interface TrustItem {
  readonly icon: ReactNode;
  readonly title: string;
  readonly subtitle?: string;
}

/**
 * Trust bar (Phase 2) — a row of icon + label assurances recurring near the
 * bottom of pages ("100% Transparent", "Data from the official API", …).
 * Pure + server-rendered; wraps responsively.
 */
export function TrustBar({
  items,
  className = '',
}: {
  items: readonly TrustItem[];
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4 sm:grid-cols-4 ${className}`}
    >
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-violet/15 text-brand-violet-light">
            {it.icon}
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-white">{it.title}</span>
            {it.subtitle ? (
              <span className="text-xs text-[var(--muted)]">{it.subtitle}</span>
            ) : null}
          </span>
        </div>
      ))}
    </div>
  );
}
