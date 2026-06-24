import type { ReactNode } from 'react';

type Tone = 'active' | 'inactive' | 'info' | 'success' | 'warning' | 'gold';

const tones: Record<Tone, string> = {
  active: 'bg-green-500/15 text-green-300 ring-green-500/30',
  success: 'bg-green-500/15 text-green-300 ring-green-500/30',
  inactive: 'bg-white/5 text-[var(--muted)] ring-white/10',
  info: 'bg-brand-violet/15 text-brand-violet-light ring-brand-violet/30',
  warning: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  gold: 'bg-brand-gold/15 text-brand-gold-light ring-brand-gold/30',
};

/** Small status pill with a leading dot. */
export function StatusBadge({
  tone = 'info',
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${tones[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}
