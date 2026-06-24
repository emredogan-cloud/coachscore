import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata, SEO_GUIDES } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Clash of Clans upgrade guides | CoachScore',
  description:
    'Evergreen Town Hall upgrade guides: what to upgrade first, hero equipment ' +
    'priority, and a free rush checker. AI-drafted, human-verified.',
  path: '/guides',
});

export default function GuidesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">
        Clash of Clans upgrade guides
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-300">
        Goal-aware upgrade orders, hero-equipment priorities, and a free rush
        checker — then get your account scored in under a minute.
      </p>
      <ul className="mt-8 space-y-3">
        {SEO_GUIDES.map((guide) => (
          <li key={guide.slug}>
            <Link
              href={`/guides/${guide.slug}`}
              className="block rounded-lg border border-gray-200 p-4 hover:border-gray-400 dark:border-gray-800"
            >
              <span className="font-medium">{guide.h1}</span>
              <span className="mt-1 block text-sm text-gray-500">
                {guide.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
