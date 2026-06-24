import type { Metadata } from 'next';
import { ProductCards } from '@/components/products/product-cards';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { HeroBanner } from '@/components/ui';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title:
    'Specialized Clash of Clans coaching tools — ReplayDoctor, BaseDoctor, WarPlan | CoachScore',
  description:
    'ReplayDoctor, BaseDoctor, and WarPlan — targeted Clash of Clans analysis ' +
    'for attack replays, base layouts, and war planning. AI-drafted, ' +
    'coach-verified.',
  path: '/products',
});

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: 'Tools', href: '/products' },
        ]}
      />
      <div className="mt-3">
        <HeroBanner
          headline="Specialized Clash of Clans coaching tools"
          tagline="Targeted analysis"
        />
      </div>
      <p className="mt-5 text-center text-[15px] text-[var(--muted)]">
        Beyond the full account score: targeted analysis for a single attack
        replay, a base layout, or your next war —{' '}
        <span className="text-white">
          generated instantly, coach-verifiable.
        </span>
      </p>
      <div className="mt-8">
        <ProductCards />
      </div>
    </div>
  );
}
