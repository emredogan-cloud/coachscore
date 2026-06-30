'use client';

import { useState } from 'react';

/**
 * Confidence-correction screen (Phase 3). Surfaces the fields OCR was unsure
 * about and lets the user correct them; the corrections are re-submitted so the
 * screenshot path can re-score with trusted values.
 */
export function ConfidenceCorrection({
  fields,
  onApply,
  submitting,
}: {
  fields: readonly string[];
  onApply: (corrections: Record<string, number>) => void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<Record<string, number>>({});

  if (fields.length === 0) return null;

  function handleApply() {
    onApply(values);
  }

  return (
    <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
      <h3 className="text-sm font-semibold text-white">
        Confirm low-confidence fields
      </h3>
      <div className="mt-3 space-y-2">
        {fields.map((field) => (
          <label
            key={field}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="text-[var(--muted)]">{field}</span>
            <input
              className="w-28 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white focus:border-brand-violet/50 focus:outline-none"
              type="number"
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  [field]: Number(e.target.value),
                }))
              }
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={handleApply}
        disabled={submitting}
        className="mt-3 inline-flex items-center justify-center rounded-xl bg-violet-gradient px-4 py-2 text-sm font-semibold text-white shadow-glow-violet-sm transition hover:shadow-glow-violet disabled:opacity-50"
      >
        Apply corrections & re-score
      </button>
    </div>
  );
}
