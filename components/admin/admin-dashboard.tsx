/**
 * Admin dashboard (Phase 5) — presentational + hook-free. Shows the coach
 * approval queue, the moderation queue, and open disputes. Snapshot-testable.
 */

export interface AdminApplication {
  readonly id: string;
  readonly displayName: string;
  readonly status: string;
}
export interface AdminModeration {
  readonly id: string;
  readonly status: string;
}
export interface AdminDispute {
  readonly id: string;
  readonly reason: string;
  readonly status: string;
}

export interface AdminDashboardData {
  readonly applications: readonly AdminApplication[];
  readonly moderationQueue: readonly AdminModeration[];
  readonly disputes: readonly AdminDispute[];
  readonly activated: boolean;
}

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  return (
    <div className="space-y-6">
      {!data.activated ? (
        <p className="rounded bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/30">
          Admin tools are implemented but not activated yet (needs the database
          + Supabase Auth + an admin role). Queues populate once connected.
        </p>
      ) : null}

      <section>
        <h2 className="text-sm font-semibold uppercase text-gray-500">
          Coach approval queue
        </h2>
        {data.applications.length === 0 ? (
          <p className="mt-1 text-sm text-gray-500">No pending applications.</p>
        ) : (
          <ul className="mt-1 space-y-1 text-sm">
            {data.applications.map((a) => (
              <li key={a.id} className="flex justify-between">
                <span>{a.displayName}</span>
                <span className="text-gray-500">{a.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase text-gray-500">
          Moderation queue
        </h2>
        {data.moderationQueue.length === 0 ? (
          <p className="mt-1 text-sm text-gray-500">
            Nothing awaiting moderation.
          </p>
        ) : (
          <ul className="mt-1 space-y-1 text-sm">
            {data.moderationQueue.map((m) => (
              <li key={m.id} className="flex justify-between">
                <span>Review {m.id}</span>
                <span className="text-gray-500">{m.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase text-gray-500">
          Open disputes
        </h2>
        {data.disputes.length === 0 ? (
          <p className="mt-1 text-sm text-gray-500">No open disputes.</p>
        ) : (
          <ul className="mt-1 space-y-1 text-sm">
            {data.disputes.map((d) => (
              <li key={d.id}>
                <span className="text-gray-500">{d.status}:</span> {d.reason}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
