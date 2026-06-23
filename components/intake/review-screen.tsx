import type { IntakeResponseBody } from '@/lib/api';

/**
 * Presentational review screen (Phase 3). Renders the computed score, the
 * fields the user should still confirm, and the persistence/activation state.
 * Pure + hook-free so it renders on the server and is snapshot-testable.
 */
export function ReviewScreen({ body }: { body: IntakeResponseBody }) {
  const { score, persistence } = body;
  return (
    <section aria-labelledby="review-heading" className="mt-6 space-y-6">
      <h2 id="review-heading" className="text-xl font-semibold">
        Your CoachScore
      </h2>

      {score ? (
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <p className="text-4xl font-bold" data-testid="grade">
            {score.grade}
            <span className="ml-2 text-lg font-normal text-gray-500">
              {score.overallRounded}/100
            </span>
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {score.rushLabel} · goal: {score.goal}
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-1 text-sm sm:grid-cols-3">
            {Object.entries(score.subScores).map(([key, value]) => (
              <li key={key} className="flex justify-between gap-2">
                <span className="capitalize text-gray-500">{key}</span>
                <span className="font-medium">
                  {value === null ? 'N/A' : Math.round(value)}
                </span>
              </li>
            ))}
          </ul>
          {score.gaps.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-sm font-semibold uppercase text-gray-500">
                Top upgrade priorities
              </h3>
              <ol className="mt-2 list-decimal pl-5 text-sm">
                {score.gaps.slice(0, 5).map((gap) => (
                  <li key={gap.id}>
                    {gap.id}{' '}
                    <span className="text-gray-500">
                      ({gap.level}/{gap.maxLevel}, {gap.category})
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          No score yet — this path needs activation before it can return data.
        </p>
      )}

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-gray-500">Confidence</dt>
        <dd className="text-right font-medium">
          {Math.round(body.confidence * 100)}%
        </dd>
        <dt className="text-gray-500">Reference verified (paid-ready)</dt>
        <dd className="text-right font-medium">
          {body.referenceReady ? 'Yes' : 'No'}
        </dd>
        <dt className="text-gray-500">Saved to your account</dt>
        <dd className="text-right font-medium" data-testid="persistence">
          {persistence.persisted
            ? 'Yes'
            : `No (${persistence.reason ?? 'not attempted'})`}
        </dd>
      </dl>

      {body.fieldsNeedingConfirmation.length > 0 ? (
        <p className="text-sm text-amber-600">
          Please confirm: {body.fieldsNeedingConfirmation.join(', ')}
        </p>
      ) : null}
    </section>
  );
}
