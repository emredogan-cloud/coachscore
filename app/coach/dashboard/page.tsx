import type { Metadata } from 'next';
import { activationStatus } from '@/lib/activation';
import { CoachDashboard } from '@/components/coach/coach-dashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Coach dashboard — CoachScore',
};

export default function CoachDashboardPage() {
  const { database } = activationStatus();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Coach dashboard</h1>
      <div className="mt-8">
        <CoachDashboard
          data={{
            coach: null,
            pendingReviews: [],
            completedReviews: [],
            earnings: { coachCents: 0, payoutCount: 0 },
            activated: database,
          }}
        />
      </div>
    </div>
  );
}
