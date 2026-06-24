import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata, SEO_GUIDES } from '@/lib/seo';
import { PremiumCard } from '@/components/ui';

// ISR (Phase 8): the guide index regenerates daily.
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: 'Clash of Clans upgrade guides | CoachScore',
  description:
    'Evergreen Town Hall upgrade guides: what to upgrade first, hero equipment ' +
    'priority, and a free rush checker. AI-drafted, human-verified.',
  path: '/guides',
});

export default function GuidesPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-white">
        Clash of Clans{' '}
        <span className="text-violet-gradient">upgrade guides</span>
      </h1>
      <p className="mt-2 text-[15px] text-[var(--muted)]">
        Goal-aware upgrade orders, hero-equipment priorities, and a free rush
        checker — then get your account scored in under a minute.
      </p>
      <ul className="mt-7 space-y-2.5">
        {SEO_GUIDES.map((guide) => (
          <li key={guide.slug}>
            <Link href={`/guides/${guide.slug}`} className="block">
              <PremiumCard
                tone="plain"
                className="p-4 transition hover:shadow-glow-violet-sm"
              >
                <span className="font-semibold text-white">{guide.h1}</span>
                <span className="mt-1 block text-sm text-[var(--muted)]">
                  {guide.description}
                </span>
              </PremiumCard>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
