'use client';

import { useReducer, useState } from 'react';
import type { ActivationStatus } from '@/lib/activation';
import type { HandlerResult, IntakeResponseBody } from '@/lib/api';
import {
  submitManualIntake,
  submitScreenshotIntake,
  submitTagIntake,
} from '@/app/intake/actions';
import { ConfidenceCorrection } from './confidence-correction';
import { ManualEntryForm } from './manual-entry-form';
import { ReviewScreen } from './review-screen';
import { ScreenshotUpload } from './screenshot-upload';
import {
  initialWizardState,
  wizardReducer,
  type IntakePath,
} from './wizard-state';

const PATHS: readonly { id: IntakePath; label: string; desc: string }[] = [
  {
    id: 'manual',
    label: 'Manual entry',
    desc: 'Type your levels — always available.',
  },
  {
    id: 'screenshot',
    label: 'Screenshots',
    desc: 'Upload screenshots; we read them.',
  },
  { id: 'tag', label: 'Player tag', desc: 'Fetch via the Clash of Clans API.' },
];

const pillClass =
  'rounded-md border border-gray-300 px-4 py-3 text-left text-sm hover:border-black dark:border-gray-700 dark:hover:border-white';

export function IntakeWizard({ activation }: { activation: ActivationStatus }) {
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  const [tag, setTag] = useState('');
  const [lastScreenshot, setLastScreenshot] = useState<Record<
    string,
    unknown
  > | null>(null);

  async function run(action: () => Promise<HandlerResult>) {
    dispatch({ type: 'submitting' });
    try {
      const result = await action();
      if (result.status === 200) {
        dispatch({ type: 'submitted', result });
      } else {
        const body = result.body as { error?: { message?: string } };
        dispatch({
          type: 'failed',
          error: body.error?.message ?? `Request failed (${result.status}).`,
        });
      }
    } catch (err) {
      dispatch({
        type: 'failed',
        error: err instanceof Error ? err.message : 'Submission failed.',
      });
    }
  }

  function onManual(body: unknown) {
    void run(() => submitManualIntake(body));
  }
  function onScreenshot(body: unknown) {
    setLastScreenshot(body as Record<string, unknown>);
    void run(() => submitScreenshotIntake(body));
  }
  function onCorrections(corrections: Record<string, number>) {
    if (lastScreenshot === null) return;
    void run(() => submitScreenshotIntake({ ...lastScreenshot, corrections }));
  }
  function onTag() {
    void run(() => submitTagIntake({ goal: state.goal, playerTag: tag }));
  }

  const reviewBody =
    state.result !== null ? (state.result.body as IntakeResponseBody) : null;

  return (
    <div className="mt-8">
      {state.error !== null ? (
        <p
          role="alert"
          className="mb-4 rounded bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950/40"
        >
          {state.error}
        </p>
      ) : null}

      {state.step === 'choose' ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {PATHS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={pillClass}
              onClick={() => dispatch({ type: 'choosePath', path: p.id })}
            >
              <span className="block font-semibold">{p.label}</span>
              <span className="mt-1 block text-xs text-gray-500">{p.desc}</span>
            </button>
          ))}
        </div>
      ) : null}

      {state.step === 'enter' ? (
        <div className="space-y-4">
          <button
            type="button"
            className="text-sm text-gray-500 underline"
            onClick={() => dispatch({ type: 'back' })}
          >
            ← Choose a different method
          </button>

          {state.path === 'manual' ? (
            <ManualEntryForm
              goal={state.goal}
              onGoalChange={(goal) => dispatch({ type: 'setGoal', goal })}
              onSubmit={onManual}
              submitting={state.submitting}
            />
          ) : null}

          {state.path === 'screenshot' ? (
            <ScreenshotUpload
              goal={state.goal}
              onSubmit={onScreenshot}
              submitting={state.submitting}
              activated={activation.ai}
            />
          ) : null}

          {state.path === 'tag' ? (
            <div className="space-y-3">
              {!activation.cocApi ? (
                <p className="rounded bg-amber-50 p-2 text-sm text-amber-700 dark:bg-amber-950/40">
                  Tag intake needs the Clash of Clans API proxy (not activated).
                  Submitting will report it as not activated.
                </p>
              ) : null}
              <label className="block text-sm">
                Player tag
                <input
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
                  value={tag}
                  placeholder="#2PP0..."
                  onChange={(e) => setTag(e.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={onTag}
                disabled={state.submitting || tag.trim() === ''}
                className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {state.submitting ? 'Fetching…' : 'Fetch & score'}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {state.step === 'review' && reviewBody !== null ? (
        <div>
          <ReviewScreen body={reviewBody} />
          {state.path === 'screenshot' &&
          reviewBody.fieldsNeedingConfirmation.length > 0 ? (
            <ConfidenceCorrection
              fields={reviewBody.fieldsNeedingConfirmation}
              onApply={onCorrections}
              submitting={state.submitting}
            />
          ) : null}
          <button
            type="button"
            className="mt-6 text-sm text-gray-500 underline"
            onClick={() => dispatch({ type: 'reset' })}
          >
            Start over
          </button>
        </div>
      ) : null}
    </div>
  );
}
