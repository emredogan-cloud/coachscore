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
    <div className="mt-4 rounded-lg border border-amber-300 p-4 dark:border-amber-800">
      <h3 className="text-sm font-semibold">Confirm low-confidence fields</h3>
      <div className="mt-2 space-y-2">
        {fields.map((field) => (
          <label
            key={field}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="text-gray-600 dark:text-gray-300">{field}</span>
            <input
              className="w-28 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
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
        className="mt-3 rounded bg-black px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-violet-gradient dark:text-white"
      >
        Apply corrections & re-score
      </button>
    </div>
  );
}
