import type { ReactNode } from 'react';

type Tone = 'violet' | 'gold' | 'plain';

const glow: Record<Tone, string> = {
  violet: 'shadow-glow-violet-sm',
  gold: 'shadow-glow-gold-sm',
  plain: 'shadow-panel',
};

/**
 * Gradient-bordered glass card — the workhorse surface of the premium theme
 * (the "shield panels" in the artwork). `tone` sets the border + glow accent.
 */
export function PremiumCard({
  children,
  tone = 'violet',
  className = '',
  glowed = false,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  glowed?: boolean;
}) {
  const border = tone === 'gold' ? 'gradient-border-gold' : 'gradient-border';
  return (
    <div
      className={`${tone === 'plain' ? 'glass' : border} rounded-2xl ${
        glowed ? glow[tone] : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
