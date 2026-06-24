import type { Metadata } from 'next';
import { activationStatus } from '@/lib/activation';
import { PricingTable } from '@/components/pricing/pricing-table';
import { ProductCards } from '@/components/products/product-cards';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pricing — CoachScore',
  description:
    'One-time CoachScore reports: a free teaser, instant AI reports, and ' +
    'human-verified coaching tiers. AI-drafted, human-verified.',
};

export default function PricingPage() {
  const { payments } = activationStatus();
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Pricing</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-300">
        One-time reports — no subscription. AI-drafted, human-verified coaching.
      </p>
      {!payments ? (
        <p className="mt-4 rounded bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/30">
          Checkout is not activated yet (Stripe not configured). Browse the
          plans below; purchasing turns on once payments are live.
        </p>
      ) : null}
      <div className="mt-8">
        <PricingTable />
      </div>

      <section className="mt-16" aria-labelledby="addons-heading">
        <h2 id="addons-heading" className="text-2xl font-bold tracking-tight">
          Specialized coaching tools
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Targeted, one-off analysis — submit an attack replay, a base layout,
          or your next war and get an instant report you can have a coach
          verify.
        </p>
        <div className="mt-6">
          <ProductCards />
        </div>
      </section>
    </div>
  );
}
