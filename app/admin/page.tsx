import type { Metadata } from 'next';
import { activationStatus } from '@/lib/activation';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin — CoachScore',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  const { database } = activationStatus();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
      <p className="mt-2 text-sm text-gray-500">
        Coach approvals, report moderation, and dispute resolution.
      </p>
      <div className="mt-8">
        <AdminDashboard
          data={{
            applications: [],
            moderationQueue: [],
            disputes: [],
            activated: database,
          }}
        />
      </div>
    </div>
  );
}
