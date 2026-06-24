/**
 * Tiny generic finite-state-machine helper (Phase 5).
 *
 * The marketplace has several lifecycles (coach status, review workflow,
 * moderation, disputes, applications). Each is defined as a transitions map and
 * gets `can`/`assert`/`isTerminal`/`next` for free — pure, total, and tested
 * once here plus per-domain.
 */

export class InvalidTransitionError extends Error {
  constructor(
    readonly from: string,
    readonly to: string,
  ) {
    super(`Invalid state transition: ${from} -> ${to}.`);
    this.name = 'InvalidTransitionError';
  }
}

export interface StateMachine<S extends string> {
  readonly transitions: Readonly<Record<S, readonly S[]>>;
  readonly states: readonly S[];
  can(from: S, to: S): boolean;
  assert(from: S, to: S): void;
  isTerminal(state: S): boolean;
  next(from: S): readonly S[];
}

export function createStateMachine<S extends string>(
  transitions: Record<S, readonly S[]>,
): StateMachine<S> {
  const states = Object.keys(transitions) as S[];
  const can = (from: S, to: S): boolean => transitions[from].includes(to);
  return {
    transitions,
    states,
    can,
    assert(from, to) {
      if (!can(from, to)) throw new InvalidTransitionError(from, to);
    },
    isTerminal(state) {
      return transitions[state].length === 0;
    },
    next(from) {
      return transitions[from];
    },
  };
}
