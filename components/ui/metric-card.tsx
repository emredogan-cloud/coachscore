import type { ReactNode } from 'react';
import { PremiumCard } from './premium-card';

/** Compact KPI stat card for dashboards (label · value · optional sublabel). */
export function MetricCard({
  label,
  value,
  sublabel,
  icon,
  tone = 'plain',
}: {
  label: string;
  value: ReactNode;
  sublabel?: string;
  icon?: ReactNode;
  tone?: 'violet' | 'gold' | 'plain';
}) {
  return (
    <PremiumCard tone={tone} className="p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          {label}
        </p>
        {icon ? <span className="text-brand-violet-light">{icon}</span> : null}
      </div>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {sublabel ? (
        <p className="mt-0.5 text-xs text-[var(--muted)]">{sublabel}</p>
      ) : null}
    </PremiumCard>
  );
}
