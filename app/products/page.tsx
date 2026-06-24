import type { Metadata } from 'next';
import { ProductCards } from '@/components/products/product-cards';

export const metadata: Metadata = {
  title: 'Specialized tools — CoachScore',
  description:
    'ReplayDoctor, BaseDoctor, and WarPlan — targeted Clash of Clans analysis ' +
    'for attack replays, base layouts, and war planning. AI-drafted, ' +
    'coach-verified.',
};

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">
        Specialized coaching tools
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-300">
        Beyond the full account score: targeted analysis for a single attack
        replay, a base layout, or your next war. Each report is generated
        instantly and can be verified by a real coach.
      </p>
      <div className="mt-8">
        <ProductCards />
      </div>
    </div>
  );
}
