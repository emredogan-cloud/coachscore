import { describe, expect, it } from 'vitest';
import { createStateMachine, InvalidTransitionError } from '@/lib/fsm';

const m = createStateMachine<'a' | 'b' | 'c'>({
  a: ['b', 'c'],
  b: ['c'],
  c: [],
});

describe('createStateMachine', () => {
  it('answers can / next / isTerminal / states', () => {
    expect(m.can('a', 'b')).toBe(true);
    expect(m.can('b', 'a')).toBe(false);
    expect(m.next('a')).toEqual(['b', 'c']);
    expect(m.isTerminal('c')).toBe(true);
    expect(m.isTerminal('a')).toBe(false);
    expect(m.states).toEqual(['a', 'b', 'c']);
  });

  it('assert throws InvalidTransitionError on an illegal move', () => {
    expect(() => m.assert('a', 'b')).not.toThrow();
    expect(() => m.assert('c', 'a')).toThrow(InvalidTransitionError);
  });
});
