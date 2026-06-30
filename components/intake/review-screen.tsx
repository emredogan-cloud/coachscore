import type { IntakeResponseBody } from '@/lib/api';
import { PremiumCard } from '@/components/ui';

/**
 * Presentational review screen (Phase 3). Renders the computed score, the
 * fields the user should still confirm, and the persistence/activation state.
 * Pure + hook-free so it renders on the server and is snapshot-testable.
 * Premium dark-native presentation (data bindings + test ids unchanged).
 */
export function ReviewScreen({ body }: { body: IntakeResponseBody }) {
  const { score, persistence } = body;
  return (
    <section aria-labelledby="review-heading" className="mt-6 space-y-6">
      <h2 id="review-heading" className="text-xl font-semibold text-white">
        Your CoachScore
      </h2>

      {score ? (
        <PremiumCard tone="violet" glowed className="p-5">
          <p className="text-4xl font-bold text-white" data-testid="grade">
            <span className="text-violet-gradient">{score.grade}</span>
            <span className="ml-2 text-lg font-normal text-[var(--muted)]">
              {score.overallRounded}/100
            </span>
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {score.rushLabel} · goal: {score.goal}
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {Object.entries(score.subScores).map(([key, value]) => (
              <li
                key={key}
                className="flex justify-between gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2"
              >
                <span className="capitalize text-[var(--muted)]">{key}</span>
                <span className="font-medium text-white">
                  {value === null ? 'N/A' : Math.round(value)}
                </span>
              </li>
            ))}
          </ul>
          {score.gaps.length > 0 ? (
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-gold">
                Top upgrade priorities
              </h3>
              <ol className="mt-2 list-decimal pl-5 text-sm text-white marker:text-brand-violet-light">
                {score.gaps.slice(0, 5).map((gap) => (
                  <li key={gap.id}>
                    {gap.id}{' '}
                    <span className="text-[var(--muted)]">
                      ({gap.level}/{gap.maxLevel}, {gap.category})
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </PremiumCard>
      ) : (
        <p className="text-sm text-[var(--muted)]">
          No score yet — this path needs activation before it can return data.
        </p>
      )}

      <dl className="grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm">
        <dt className="text-[var(--muted)]">Confidence</dt>
        <dd className="text-right font-medium text-white">
          {Math.round(body.confidence * 100)}%
        </dd>
        <dt className="text-[var(--muted)]">Reference verified (paid-ready)</dt>
        <dd className="text-right font-medium text-white">
          {body.referenceReady ? 'Yes' : 'No'}
        </dd>
        <dt className="text-[var(--muted)]">Saved to your account</dt>
        <dd
          className="text-right font-medium text-white"
          data-testid="persistence"
        >
          {persistence.persisted
            ? 'Yes'
            : `No (${persistence.reason ?? 'not attempted'})`}
        </dd>
      </dl>

      {body.fieldsNeedingConfirmation.length > 0 ? (
        <p className="text-sm text-amber-300">
          Please confirm: {body.fieldsNeedingConfirmation.join(', ')}
        </p>
      ) : null}
    </section>
  );
}
