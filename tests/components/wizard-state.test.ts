import { describe, expect, it } from 'vitest';
import {
  initialWizardState,
  wizardReducer,
} from '@/components/intake/wizard-state';
import type { HandlerResult } from '@/lib/api';

const result: HandlerResult = { status: 200, body: { ok: true } };

describe('wizardReducer', () => {
  it('choosePath moves to the enter step', () => {
    const s = wizardReducer(initialWizardState, {
      type: 'choosePath',
      path: 'manual',
    });
    expect(s.step).toBe('enter');
    expect(s.path).toBe('manual');
  });

  it('setGoal updates the goal', () => {
    const s = wizardReducer(initialWizardState, {
      type: 'setGoal',
      goal: 'war',
    });
    expect(s.goal).toBe('war');
  });

  it('submitting → submitted lands on review', () => {
    let s = wizardReducer(initialWizardState, { type: 'submitting' });
    expect(s.submitting).toBe(true);
    s = wizardReducer(s, { type: 'submitted', result });
    expect(s.step).toBe('review');
    expect(s.submitting).toBe(false);
    expect(s.result).toBe(result);
  });

  it('failed records the error and clears submitting', () => {
    const s = wizardReducer(
      { ...initialWizardState, submitting: true },
      { type: 'failed', error: 'boom' },
    );
    expect(s.submitting).toBe(false);
    expect(s.error).toBe('boom');
  });

  it('back from review returns to enter; back from enter returns to choose', () => {
    const review = {
      ...initialWizardState,
      step: 'review' as const,
      path: 'manual' as const,
      result,
    };
    expect(wizardReducer(review, { type: 'back' }).step).toBe('enter');
    const enter = {
      ...initialWizardState,
      step: 'enter' as const,
      path: 'tag' as const,
    };
    expect(wizardReducer(enter, { type: 'back' }).step).toBe('choose');
  });

  it('reset returns to initial but keeps the chosen goal', () => {
    const s = wizardReducer(
      { ...initialWizardState, step: 'review', goal: 'war', result },
      { type: 'reset' },
    );
    expect(s.step).toBe('choose');
    expect(s.goal).toBe('war');
    expect(s.result).toBeNull();
  });
});
