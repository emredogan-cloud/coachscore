import { Children, type ReactNode } from 'react';

/**
 * Reusable motion primitives (immersion sprint · Section 8).
 *
 * CSS-first by design: these wrap the `fade-up` Tailwind keyframe rather than
 * pulling in a JS animation library, so they stay server-renderable and add
 * ZERO client JS — preserving the static/SSG + Core-Web-Vitals posture the SEO
 * work depends on. The global `prefers-reduced-motion` rule in `globals.css`
 * disables them for users who opt out. For value count-ups use `<CountUp>`
 * (the one place a tiny client island is justified).
 */
export function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`animate-fade-up ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/**
 * Staggers a vertical stack of children — each enters with an incremental
 * delay. Children are wrapped in a `FadeUp`, so this is for stacked content
 * (lists, sections), not for direct grid/flex children that must stay direct.
 */
export function StaggerGroup({
  children,
  step = 80,
  className = '',
}: {
  children: ReactNode;
  step?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Children.map(children, (child, i) => (
        <FadeUp delay={i * step}>{child}</FadeUp>
      ))}
    </div>
  );
}
