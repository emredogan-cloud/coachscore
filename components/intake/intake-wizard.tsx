'use client';

import { useReducer, useState } from 'react';
import type { ActivationStatus } from '@/lib/activation';
import type { HandlerResult, IntakeResponseBody } from '@/lib/api';
import type { Goal } from '@/lib/core';
import {
  submitManualIntake,
  submitScreenshotIntake,
  submitTagIntake,
} from '@/app/intake/actions';
import { MagicButton, SectionDivider, TrustBar } from '@/components/ui';
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

const GOALS: readonly { value: Goal; label: string }[] = [
  { value: 'rate', label: 'Rate my account' },
  { value: 'progress', label: 'Steady progress' },
  { value: 'war', label: 'Win wars / CWL' },
  { value: 'trophy', label: 'Push trophies' },
  { value: 'derush', label: 'De-rush' },
  { value: 'recruit', label: 'Get recruited' },
];

// Dark-native input/select base (NO `dark:` prefixes — there is no `dark` class
// on <html>, so they would be inert; style the dark surface directly).
const inputClass =
  'mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-[var(--muted)]/60 focus:border-brand-violet/50 focus:outline-none';

// Trust assurances shown near the bottom of the intake flow.
const trustIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M12 2l8 3v6c0 5-3.5 8-8 11-4.5-3-8-6-8-11V5l8-3z" />
  </svg>
);
const TRUST_ITEMS = [
  { icon: trustIcon, title: 'Free & instant', subtitle: 'No signup to score' },
  {
    icon: trustIcon,
    title: '100% objective',
    subtitle: 'Deterministic engine',
  },
  {
    icon: trustIcon,
    title: 'Private & secure',
    subtitle: 'You control your data',
  },
  {
    icon: trustIcon,
    title: 'Built for players',
    subtitle: 'Plain-language input',
  },
];

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
          className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-200"
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
              className="group rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-left transition hover:border-brand-violet/40 hover:bg-white/[0.06] hover:shadow-glow-violet-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet-light/70"
              onClick={() => dispatch({ type: 'choosePath', path: p.id })}
            >
              <span className="block font-semibold text-white">{p.label}</span>
              <span className="mt-1 block text-xs text-[var(--muted)]">
                {p.desc}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {state.step === 'enter' ? (
        <div className="space-y-4">
          <button
            type="button"
            className="text-sm text-[var(--muted)] underline-offset-4 transition hover:text-white hover:underline"
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
            <div className="space-y-4">
              {!activation.cocApi ? (
                <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-200/90">
                  Tag intake needs the Clash of Clans API proxy (not activated).
                  Submitting will report it as not activated.
                </p>
              ) : null}
              <label className="block text-sm">
                <span className="font-medium text-white">Player tag</span>
                <span className="relative mt-1 block">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-base font-bold text-brand-gold"
                  >
                    #
                  </span>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-8 pr-3 text-sm text-white placeholder:text-[var(--muted)]/60 focus:border-brand-violet/50 focus:outline-none"
                    value={tag}
                    placeholder="2PP0..."
                    onChange={(e) => setTag(e.target.value)}
                  />
                </span>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-white">Goal</span>
                <select
                  className={inputClass}
                  value={state.goal}
                  onChange={(e) =>
                    dispatch({
                      type: 'setGoal',
                      goal: e.target.value as Goal,
                    })
                  }
                >
                  {GOALS.map((g) => (
                    <option
                      key={g.value}
                      value={g.value}
                      className="bg-[#0b0a14]"
                    >
                      {g.label}
                    </option>
                  ))}
                </select>
              </label>
              <MagicButton
                variant="violet"
                size="lg"
                type="button"
                onClick={onTag}
                disabled={state.submitting || tag.trim() === ''}
              >
                {state.submitting ? 'Fetching…' : 'Analyze my account'}
              </MagicButton>
              <p className="text-center text-sm text-[var(--muted)]">
                No tag handy?{' '}
                <button
                  type="button"
                  className="font-medium text-brand-violet-light underline-offset-4 transition hover:text-white hover:underline"
                  onClick={() =>
                    dispatch({ type: 'choosePath', path: 'manual' })
                  }
                >
                  Enter your levels manually
                </button>
              </p>
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
            className="mt-6 text-sm text-[var(--muted)] underline-offset-4 transition hover:text-white hover:underline"
            onClick={() => dispatch({ type: 'reset' })}
          >
            Start over
          </button>
        </div>
      ) : null}

      {state.step !== 'review' ? (
        <div className="mt-10 space-y-5">
          <SectionDivider>Why CoachScore</SectionDivider>
          <TrustBar items={TRUST_ITEMS} />
        </div>
      ) : null}
    </div>
  );
}
