/**
 * Premium loading spinner (Visual Immersion sprint · W7). A gold arc sweeping a
 * faint violet track — inherits `currentColor` so it tints to its context (gold
 * on dark, ink on the gold CTA). Pure CSS rotation (Tailwind `animate-spin`),
 * reduced-motion-safe via the global rule. Use inside async buttons/panels.
 */
export function Spinner({
  size = 18,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-flex ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin"
        aria-hidden
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="3"
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
