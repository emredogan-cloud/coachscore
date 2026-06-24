import type { ShareTarget } from '@/lib/share';

/**
 * Social share buttons (Phase 7) — presentational, hook-free. Renders the share
 * targets from `buildShareTargets` / `buildReferralShare` as links.
 */
export function ShareButtons({ targets }: { targets: readonly ShareTarget[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {targets.map((target) => (
        <a
          key={target.network}
          href={target.href}
          target={target.network === 'copy' ? undefined : '_blank'}
          rel="noopener noreferrer"
          className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:border-gray-500 dark:border-gray-700"
        >
          {target.label}
        </a>
      ))}
    </div>
  );
}
