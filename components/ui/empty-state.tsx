import type { ReactNode } from 'react';
import { PremiumCard } from './premium-card';

/**
 * Tasteful empty / not-activated state — a centered glyph, title, message, and
 * optional action. Used for gated dashboards/referrals instead of a bare banner.
 */
export function EmptyState({
  icon,
  title,
  message,
  action,
  tone = 'violet',
}: {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
  tone?: 'violet' | 'gold' | 'plain';
}) {
  return (
    <PremiumCard tone={tone} className="px-6 py-10 text-center">
      {icon ? (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-2xl text-brand-violet-light">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-[var(--muted)]">
        {message}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </PremiumCard>
  );
}
