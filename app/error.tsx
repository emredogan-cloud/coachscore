'use client';

import { useEffect } from 'react';
import { EyebrowPill, MagicButton } from '@/components/ui';

/**
 * Premium error boundary (Phase 6 friction audit). Replaces Next's unstyled
 * default error page — which is a dead end — with the brand surface, a retry
 * (reset re-renders the segment), and a path home. The root layout still wraps
 * this with the nav, footer, and global back button.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the console for diagnosis; production telemetry is best-effort.
    console.error('Unhandled UI error:', error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <EyebrowPill tone="gold">Something broke</EyebrowPill>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-violet-gradient">
        That didn&apos;t go to plan
      </h1>
      <p className="mt-3 text-[15px] text-[var(--muted)]">
        A hiccup on our side — your data is safe. Try again, or head back and
        re-run your analysis.
      </p>
      <div className="mt-8 flex w-full flex-col gap-3">
        <MagicButton type="button" variant="gold" size="lg" onClick={reset}>
          Try again
        </MagicButton>
        <MagicButton href="/" variant="ghost">
          Back to home
        </MagicButton>
      </div>
    </div>
  );
}
