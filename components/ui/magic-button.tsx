import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'gold' | 'violet' | 'ghost';
type Size = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-wide transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet-light/70 disabled:opacity-50';

const variants: Record<Variant, string> = {
  gold: 'bg-gold-gradient text-ink-950 shadow-glow-gold-sm hover:shadow-glow-gold',
  violet:
    'bg-violet-gradient text-white shadow-glow-violet-sm hover:shadow-glow-violet',
  ghost:
    'gradient-border text-brand-violet-light hover:text-white hover:shadow-glow-violet-sm',
};

const sizes: Record<Size, string> = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base w-full',
};

type Props = {
  variant?: Variant;
  size?: Size;
  href?: string;
  children: ReactNode;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

/** Glowing gradient CTA — gold = primary, violet = secondary, ghost = tertiary. */
export function MagicButton({
  variant = 'violet',
  size = 'md',
  href,
  children,
  className = '',
  ...rest
}: Props) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
