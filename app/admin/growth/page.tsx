import type { Metadata } from 'next';
import { handleGrowthDashboard } from '@/lib/api';
import { GrowthDashboardView } from '@/components/growth/growth-dashboard';
import type { GrowthDashboard } from '@/lib/growth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Growth — CoachScore admin',
  robots: { index: false, follow: false },
};

export default async function GrowthAdminPage() {
  const result = await handleGrowthDashboard();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Growth dashboard</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-300">
        Funnels, experiments, and the referral loop — the operating metrics from
        the growth strategy.
      </p>
      <div className="mt-8">
        {result.status === 200 ? (
          <GrowthDashboardView
            dashboard={
              (result.body as { dashboard: GrowthDashboard }).dashboard
            }
          />
        ) : (
          <p className="rounded bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/30">
            The growth dashboard activates once the database and admin auth are
            provisioned. All metric aggregation is built and tested.
          </p>
        )}
      </div>
    </div>
  );
}
