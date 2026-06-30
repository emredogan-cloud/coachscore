import type { ReactNode } from 'react';

/**
 * Small rounded outline pill used as a section eyebrow / status label (Phase 2)
 * — e.g. "FREE · OBJECTIVE · INSTANT", "MOST POPULAR", "ILLUSTRATIVE EXAMPLE".
 * Gold (default) or violet tone. Pure + server-rendered.
 */
export function EyebrowPill({
  children,
  tone = 'gold',
  className = '',
}: {
  children: ReactNode;
  tone?: 'gold' | 'violet';
  className?: string;
}) {
  const tones = {
    gold: 'border-brand-gold/40 text-brand-gold',
    violet: 'border-brand-violet-light/45 text-brand-violet-light',
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
