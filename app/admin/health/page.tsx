import type { Metadata } from 'next';
import { healthReport } from '@/lib/observability';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Health — CoachScore admin',
  robots: { index: false, follow: false },
};

export default function HealthPage() {
  const report = healthReport();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">System health</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-300">
        Activation matrix — which credential-gated subsystems are live (env:{' '}
        {report.env}). {report.activatedCount} of {report.subsystems.length}{' '}
        activated.
      </p>
      <ul className="mt-6 space-y-1 text-sm">
        {report.subsystems.map((s) => (
          <li key={s.name} className="flex items-center justify-between">
            <span className="capitalize">{s.name}</span>
            <span className={s.configured ? 'text-green-600' : 'text-gray-400'}>
              {s.configured ? 'active' : 'not activated'}
            </span>
          </li>
        ))}
        <li className="flex items-center justify-between border-t border-gray-200 pt-1 dark:border-gray-800">
          <span>Error monitoring (Sentry)</span>
          <span
            className={
              report.observability.errorMonitoring
                ? 'text-green-600'
                : 'text-gray-400'
            }
          >
            {report.observability.errorMonitoring ? 'active' : 'not activated'}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span>Uptime heartbeat</span>
          <span
            className={
              report.observability.uptime ? 'text-green-600' : 'text-gray-400'
            }
          >
            {report.observability.uptime ? 'active' : 'not activated'}
          </span>
        </li>
      </ul>
    </div>
  );
}
