'use client';

import { usePathname, useRouter } from 'next/navigation';

/**
 * A sensible parent route for a path, by dropping the last segment. Used as the
 * cold-load fallback when there is no in-app history to go back to, so the back
 * button is never a dead end. Pure + unit-tested.
 *   /guides/th16-upgrade-order → /guides
 *   /products/replay-doctor    → /products
 *   /methodology               → /
 */
export function parentPath(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length <= 1) return '/';
  return '/' + parts.slice(0, -1).join('/');
}

/**
 * Global back button (Phase 6). Renders on every screen except the home page.
 * Prefers in-app history (returns the user to wherever they came from); on a
 * cold/direct load with no history it pushes the parent route instead, so the
 * control is never a dead end. Aligned to the nav container so it always sits
 * just under the brand mark, independent of page content width. Client island.
 */
export function BackButton() {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  if (pathname === '/') return null;

  function goBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(parentPath(pathname));
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm font-medium text-[var(--muted)] transition hover:border-white/20 hover:text-white"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </button>
    </div>
  );
}
