import type { RenderableReport } from '@/lib/report';

/**
 * Full report view (Phase 4). Presentational + hook-free, so it renders on the
 * server and is snapshot-testable. Shows diagnosis, strengths/weaknesses,
 * sub-scores, the upgrade roadmap, recommendations, and confidence/reference
 * indicators with the locked report version.
 */
export function ReportView({ report }: { report: RenderableReport }) {
  return (
    <section aria-labelledby="report-heading" className="space-y-6">
      <header>
        <h2 id="report-heading" className="text-2xl font-bold">
          CoachScore Report
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Town Hall {report.townHall} · {report.rushLabel} · goal: {report.goal}
          {report.aiAuthored ? ' · AI-drafted' : ' · auto-generated'}
        </p>
        <p className="mt-3 text-5xl font-bold">
          {report.grade}
          <span className="ml-3 text-xl font-normal text-gray-500">
            {report.overall}/100
          </span>
        </p>
      </header>

      <div>
        <h3 className="text-sm font-semibold uppercase text-gray-500">
          Diagnosis
        </h3>
        <p className="mt-1">{report.diagnosis}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold uppercase text-gray-500">
            Strengths
          </h3>
          {report.strengths.length === 0 ? (
            <p className="mt-1 text-sm text-gray-500">None standing out yet.</p>
          ) : (
            <ul className="mt-1 text-sm">
              {report.strengths.map((s) => (
                <li key={s.key} className="flex justify-between">
                  <span>{s.label}</span>
                  <span className="font-medium">{s.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase text-gray-500">
            Weaknesses
          </h3>
          {report.weaknesses.length === 0 ? (
            <p className="mt-1 text-sm text-gray-500">No dominant weakness.</p>
          ) : (
            <ul className="mt-1 text-sm">
              {report.weaknesses.map((w) => (
                <li key={w.key} className="flex justify-between">
                  <span>{w.label}</span>
                  <span className="font-medium">{w.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase text-gray-500">
          Sub-scores
        </h3>
        <ul className="mt-1 grid grid-cols-2 gap-1 text-sm sm:grid-cols-3">
          {report.subScores.map((s) => (
            <li key={s.key} className="flex justify-between gap-2">
              <span className="text-gray-500">{s.label}</span>
              <span className="font-medium">
                {s.value === null ? 'N/A' : Math.round(s.value)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase text-gray-500">
          Upgrade roadmap
        </h3>
        {report.roadmap.length === 0 ? (
          <p className="mt-1 text-sm text-gray-500">
            Account is maxed for this Town Hall under this goal.
          </p>
        ) : (
          <ol className="mt-1 list-decimal space-y-2 pl-5 text-sm">
            {report.roadmap.map((step) => (
              <li key={`${step.rank}-${step.elementId}`}>
                <span className="font-medium">{step.elementId}</span>:{' '}
                {step.fromLevel}
                {' → '}
                {step.toLevel}{' '}
                <span className="text-gray-500">[{step.estimatedImpact}]</span>
                <br />
                <span className="text-gray-500">{step.rationale}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase text-gray-500">
          Recommendations
        </h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
          {report.recommendations.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </div>

      <footer className="border-t border-gray-200 pt-3 text-xs text-gray-500 dark:border-gray-800">
        <p>
          Confidence {Math.round(report.confidence * 100)}% · Reference verified
          for paid use: {report.referenceReady ? 'yes' : 'no'}
          {report.needsHumanReview ? ' · flagged for human review' : ''}
        </p>
        <p className="mt-1">Version: {report.version.composite}</p>
      </footer>
    </section>
  );
}
