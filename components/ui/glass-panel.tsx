import type { ReactNode } from 'react';

/** Base glassmorphism surface (Phase B premium theme). */
export function GlassPanel({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'aside';
}) {
  return <Tag className={`glass rounded-2xl ${className}`}>{children}</Tag>;
}
