import { describe, expect, it } from 'vitest';
import {
  BudgetExceededError,
  BudgetGuard,
  CostAccountant,
  estimateCostCents,
  priceForModel,
} from '@/lib/ai';

describe('cost estimation', () => {
  it('resolves price by model family', () => {
    expect(priceForModel('claude-opus-4-8').outputPerMillion).toBe(7500);
    expect(priceForModel('claude-haiku-4-5-20251001').inputPerMillion).toBe(80);
    expect(priceForModel('claude-sonnet-4-6').inputPerMillion).toBe(300);
    expect(priceForModel('mystery-model').inputPerMillion).toBe(300); // fallback
  });

  it('prices per-million tokens and discounts cache reads', () => {
    expect(
      estimateCostCents('claude-opus-4-8', {
        inputTokens: 1_000_000,
        outputTokens: 0,
      }),
    ).toBe(1500);
    // All input served from cache → billed at the cache-read rate.
    expect(
      estimateCostCents('claude-opus-4-8', {
        inputTokens: 1_000_000,
        outputTokens: 0,
        cacheReadInputTokens: 1_000_000,
      }),
    ).toBe(150);
  });
});

describe('CostAccountant', () => {
  it('accumulates cost + tokens across calls', () => {
    const acc = new CostAccountant();
    acc.record('claude-haiku-4-5', { inputTokens: 1_000_000, outputTokens: 0 });
    acc.record('claude-haiku-4-5', { inputTokens: 0, outputTokens: 1_000_000 });
    expect(acc.totalCents()).toBe(80 + 400);
    expect(acc.totalTokens()).toEqual({ input: 1_000_000, output: 1_000_000 });
    expect(acc.list()).toHaveLength(2);
  });
});

describe('BudgetGuard', () => {
  it('allows work under budget and refuses once exceeded', () => {
    const guard = new BudgetGuard(1000);
    expect(() => guard.assertWithinBudget()).not.toThrow();
    guard.record('claude-opus-4-8', {
      inputTokens: 1_000_000,
      outputTokens: 0,
    }); // 1500¢
    expect(guard.remainingCents()).toBe(0);
    expect(() => guard.assertWithinBudget()).toThrow(BudgetExceededError);
  });
});
