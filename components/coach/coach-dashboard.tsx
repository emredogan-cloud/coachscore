/**
 * Coach dashboard (Phase 5) — presentational + hook-free, so it renders on the
 * server and is snapshot-testable. Shows the coach summary, the review queue
 * (pending / completed), and an earnings summary.
 */

export interface DashboardReview {
  readonly id: string;
  readonly reportId: string;
  readonly status: string;
}

export interface CoachDashboardData {
  readonly coach: {
    readonly displayName: string;
    readonly status: string;
    readonly reputationScore: number;
    readonly ratingCount: number;
  } | null;
  readonly pendingReviews: readonly DashboardReview[];
  readonly completedReviews: readonly DashboardReview[];
  readonly earnings: {
    readonly coachCents: number;
    readonly payoutCount: number;
  };
  readonly activated: boolean;
}

function ReviewList({ reviews }: { reviews: readonly DashboardReview[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-gray-500">Nothing here yet.</p>;
  }
  return (
    <ul className="mt-1 space-y-1 text-sm">
      {reviews.map((r) => (
        <li key={r.id} className="flex justify-between">
          <span>Report {r.reportId}</span>
          <span className="text-gray-500">{r.status}</span>
        </li>
      ))}
    </ul>
  );
}

export function CoachDashboard({ data }: { data: CoachDashboardData }) {
  return (
    <div className="space-y-6">
      {!data.activated ? (
        <p className="rounded bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/30">
          The coach marketplace is implemented but not activated yet (needs the
          database + Supabase Auth). This dashboard shows your live data once it
          is connected.
        </p>
      ) : null}

      <section>
        <h2 className="text-sm font-semibold uppercase text-gray-500">
          Profile
        </h2>
        {data.coach === null ? (
          <p className="mt-1 text-sm text-gray-500">
            No coach profile yet. Apply to become a coach to get started.
          </p>
        ) : (
          <p className="mt-1 text-sm">
            <span className="font-medium">{data.coach.displayName}</span> ·{' '}
            {data.coach.status} · reputation {data.coach.reputationScore}/100 (
            {data.coach.ratingCount} ratings)
          </p>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase text-gray-500">
          Pending reviews
        </h2>
        <ReviewList reviews={data.pendingReviews} />
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase text-gray-500">
          Completed reviews
        </h2>
        <ReviewList reviews={data.completedReviews} />
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase text-gray-500">
          Earnings
        </h2>
        <p className="mt-1 text-sm">
          ${(data.earnings.coachCents / 100).toFixed(2)} across{' '}
          {data.earnings.payoutCount} payout
          {data.earnings.payoutCount === 1 ? '' : 's'} (60% coach share).
        </p>
      </section>
    </div>
  );
}
