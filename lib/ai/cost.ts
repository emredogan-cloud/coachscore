/**
 * AI cost + token accounting (Phase 8).
 *
 * Pure, deterministic cost estimation from token usage + a configurable price
 * table, a running `CostAccountant`, and a `BudgetGuard` that refuses work once
 * a spend ceiling is hit (budget protection). No I/O — the provider reports
 * usage; this layer prices it. Prices are approximate USD-cents per million
 * tokens and are intentionally easy to update as vendor pricing moves.
 */

import type { ProviderUsage } from './types';

export interface ModelPrice {
  /** Cents per 1M input tokens. */
  readonly inputPerMillion: number;
  /** Cents per 1M output tokens. */
  readonly outputPerMillion: number;
  /** Cents per 1M cached-read input tokens (prompt cache hit ≈ 10% of input). */
  readonly cacheReadPerMillion: number;
}

/** Approximate prices by model family (cents / 1M tokens). Update on repricing. */
export const MODEL_PRICING: Readonly<Record<string, ModelPrice>> = {
  opus: {
    inputPerMillion: 1500,
    outputPerMillion: 7500,
    cacheReadPerMillion: 150,
  },
  sonnet: {
    inputPerMillion: 300,
    outputPerMillion: 1500,
    cacheReadPerMillion: 30,
  },
  haiku: { inputPerMillion: 80, outputPerMillion: 400, cacheReadPerMillion: 8 },
};

const DEFAULT_PRICE: ModelPrice = MODEL_PRICING.sonnet!;

/** Resolve a price by matching the model id against a known family. */
export function priceForModel(model: string): ModelPrice {
  const id = model.toLowerCase();
  if (id.includes('opus')) return MODEL_PRICING.opus!;
  if (id.includes('haiku')) return MODEL_PRICING.haiku!;
  if (id.includes('sonnet')) return MODEL_PRICING.sonnet!;
  return DEFAULT_PRICE;
}

/** Estimated cost in (fractional) cents for one call's usage. */
export function estimateCostCents(model: string, usage: ProviderUsage): number {
  const price = priceForModel(model);
  const cacheRead = usage.cacheReadInputTokens ?? 0;
  const freshInput = Math.max(0, usage.inputTokens - cacheRead);
  return (
    (freshInput / 1_000_000) * price.inputPerMillion +
    (cacheRead / 1_000_000) * price.cacheReadPerMillion +
    (usage.outputTokens / 1_000_000) * price.outputPerMillion
  );
}

export interface CostEntry {
  readonly model: string;
  readonly usage: ProviderUsage;
  readonly costCents: number;
}

/** Accumulates spend across calls (per-request or per-job accounting). */
export class CostAccountant {
  private readonly entries: CostEntry[] = [];

  record(model: string, usage: ProviderUsage): CostEntry {
    const entry: CostEntry = {
      model,
      usage,
      costCents: estimateCostCents(model, usage),
    };
    this.entries.push(entry);
    return entry;
  }

  totalCents(): number {
    return this.entries.reduce((sum, e) => sum + e.costCents, 0);
  }

  totalTokens(): { input: number; output: number } {
    return this.entries.reduce(
      (acc, e) => ({
        input: acc.input + e.usage.inputTokens,
        output: acc.output + e.usage.outputTokens,
      }),
      { input: 0, output: 0 },
    );
  }

  list(): readonly CostEntry[] {
    return this.entries;
  }
}

export class BudgetExceededError extends Error {
  constructor(
    readonly spentCents: number,
    readonly limitCents: number,
  ) {
    super(
      `AI budget exceeded: spent ${spentCents.toFixed(2)}¢ of ${limitCents}¢.`,
    );
    this.name = 'BudgetExceededError';
  }
}

/** Refuses further work once the accountant's spend reaches the ceiling. */
export class BudgetGuard {
  constructor(
    private readonly limitCents: number,
    private readonly accountant: CostAccountant = new CostAccountant(),
  ) {}

  get account(): CostAccountant {
    return this.accountant;
  }

  remainingCents(): number {
    return Math.max(0, this.limitCents - this.accountant.totalCents());
  }

  /** Throw if already over budget — call before an expensive request. */
  assertWithinBudget(): void {
    if (this.accountant.totalCents() >= this.limitCents) {
      throw new BudgetExceededError(
        this.accountant.totalCents(),
        this.limitCents,
      );
    }
  }

  record(model: string, usage: ProviderUsage): CostEntry {
    return this.accountant.record(model, usage);
  }
}
