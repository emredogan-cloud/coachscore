import { Disclaimer } from '@/components/disclaimer';
import type { ProductReportView as ProductReport } from '@/lib/products';

/**
 * Uniform product report view (Phase 6) — one presentational, hook-free
 * component for ReplayDoctor / BaseDoctor / WarPlan (they share the
 * `ProductReportView` shape). Server-rendered + snapshot-testable; also embedded
 * inside the client submission flow to show the result inline.
 */
export function ProductReportViewCard({ report }: { report: ProductReport }) {
  return (
    <section aria-labelledby="product-report-heading" className="space-y-6">
      <header>
        <h2 id="product-report-heading" className="text-2xl font-bold">
          {report.title}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {report.aiAuthored ? 'AI-drafted' : 'Auto-generated'} ·{' '}
          {report.score
            ? `${report.score.label}: ${report.score.value}/100`
            : 'No score'}
        </p>
        {report.score ? (
          <p className="mt-3 text-5xl font-bold">
            {report.score.value}
            <span className="ml-2 text-xl font-normal text-gray-500">/100</span>
          </p>
        ) : null}
      </header>

      <div>
        <h3 className="text-sm font-semibold uppercase text-gray-500">
          Summary
        </h3>
        <p className="mt-1">{report.summary}</p>
      </div>

      {report.sections.map((section) => (
        <div key={section.key}>
          <h3 className="text-sm font-semibold uppercase text-gray-500">
            {section.title}
          </h3>
          {section.items.length === 0 ? (
            <p className="mt-1 text-sm text-gray-500">Nothing flagged here.</p>
          ) : (
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
              {section.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}

      <div>
        <h3 className="text-sm font-semibold uppercase text-gray-500">
          Recommendations
        </h3>
        {report.recommendations.length === 0 ? (
          <p className="mt-1 text-sm text-gray-500">No recommendations.</p>
        ) : (
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
            {report.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ol>
        )}
      </div>

      <footer className="border-t border-gray-200 pt-3 text-xs text-gray-500 dark:border-gray-800">
        <p>
          Confidence {Math.round(report.confidence * 100)}% ·{' '}
          {report.aiAuthored
            ? 'AI-drafted, pending coach verification'
            : 'Deterministic analysis'}
        </p>
        <p className="mt-1">Version: {report.version}</p>
      </footer>

      <Disclaimer />
    </section>
  );
}
