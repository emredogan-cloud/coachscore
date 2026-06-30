import type { Metadata } from 'next';
import { EyebrowPill, MagicButton } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Page not found — CoachScore',
  robots: { index: false, follow: false },
};

/**
 * Premium 404 (Phase 6 friction audit). Next's default not-found is an unstyled
 * dead end with no way back into the funnel; this gives any bad URL — and the
 * feature-gated routes that call notFound() — the brand surface plus two clear
 * exits (analyze = the magic moment, home). The root layout already wraps this
 * with the nav, footer, and global back button.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <EyebrowPill tone="gold">404</EyebrowPill>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-violet-gradient">
        This page wandered off the battlefield
      </h1>
      <p className="mt-3 text-[15px] text-[var(--muted)]">
        The link may be broken or the page moved. Your account analysis is just
        one tag away — let&apos;s get you back to it.
      </p>
      <div className="mt-8 flex w-full flex-col gap-3">
        <MagicButton href="/report" variant="gold" size="lg">
          Analyze my account
        </MagicButton>
        <MagicButton href="/" variant="ghost">
          Back to home
        </MagicButton>
      </div>
    </div>
  );
}
