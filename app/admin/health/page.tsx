import type { Metadata } from 'next';
import { healthReport } from '@/lib/observability';
import { PremiumCard, ScoreRing, StatusBadge } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Health — CoachScore admin',
  robots: { index: false, follow: false },
};

export default function HealthPage() {
  const report = healthReport();
  const total = report.subsystems.length;
  const pct =
    total === 0 ? 0 : Math.round((report.activatedCount / total) * 100);

  const rows = [
    ...report.subsystems.map((s) => ({ name: s.name, on: s.configured })),
    {
      name: 'Error monitoring (Sentry)',
      on: report.observability.errorMonitoring,
    },
    { name: 'Uptime heartbeat', on: report.observability.uptime },
  ];

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-white">
        System health
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Activation matrix — which credential-gated subsystems are live (env:{' '}
        {report.env}).
      </p>

      <PremiumCard
        tone="gold"
        glowed
        className="mt-6 flex items-center gap-5 p-5"
      >
        <ScoreRing
          value={pct}
          label="Activated"
          size={108}
          grade={`${report.activatedCount}/${total}`}
        />
        <div>
          <p className="text-sm font-semibold text-white">
            {report.activatedCount} of {total} core subsystems active
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Credential-gated; light up as services are provisioned.
          </p>
        </div>
      </PremiumCard>

      <PremiumCard tone="plain" className="mt-5 divide-y divide-white/5 p-2">
        {rows.map((r) => (
          <div
            key={r.name}
            className="flex items-center justify-between px-3 py-2.5"
          >
            <span className="text-sm capitalize text-[var(--fg)]/90">
              {r.name}
            </span>
            <StatusBadge tone={r.on ? 'active' : 'inactive'}>
              {r.on ? 'active' : 'not activated'}
            </StatusBadge>
          </div>
        ))}
      </PremiumCard>
    </div>
  );
}
