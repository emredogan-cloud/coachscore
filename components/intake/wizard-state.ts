/**
 * Pure intake-wizard state machine (Phase 3).
 *
 * Kept free of React so the step transitions are unit-tested directly. The
 * wizard component (`intake-wizard.tsx`) drives this via `useReducer`.
 */

import type { Goal } from '@/lib/core';
import type { HandlerResult } from '@/lib/api';

export type IntakePath = 'manual' | 'tag' | 'screenshot';
export type WizardStep = 'choose' | 'enter' | 'review';

export interface WizardState {
  readonly step: WizardStep;
  readonly path: IntakePath | null;
  readonly goal: Goal;
  readonly submitting: boolean;
  readonly result: HandlerResult | null;
  readonly error: string | null;
}

export const initialWizardState: WizardState = {
  step: 'choose',
  path: null,
  goal: 'rate',
  submitting: false,
  result: null,
  error: null,
};

export type WizardAction =
  | { readonly type: 'choosePath'; readonly path: IntakePath }
  | { readonly type: 'setGoal'; readonly goal: Goal }
  | { readonly type: 'submitting' }
  | { readonly type: 'submitted'; readonly result: HandlerResult }
  | { readonly type: 'failed'; readonly error: string }
  | { readonly type: 'back' }
  | { readonly type: 'reset' };

export function wizardReducer(
  state: WizardState,
  action: WizardAction,
): WizardState {
  switch (action.type) {
    case 'choosePath':
      return { ...state, step: 'enter', path: action.path, error: null };
    case 'setGoal':
      return { ...state, goal: action.goal };
    case 'submitting':
      return { ...state, submitting: true, error: null };
    case 'submitted':
      return {
        ...state,
        submitting: false,
        step: 'review',
        result: action.result,
        error: null,
      };
    case 'failed':
      return { ...state, submitting: false, error: action.error };
    case 'back':
      return state.step === 'review'
        ? { ...state, step: 'enter', result: null }
        : { ...initialWizardState, goal: state.goal };
    case 'reset':
      return { ...initialWizardState, goal: state.goal };
    default:
      return state;
  }
}
