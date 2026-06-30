/**
 * Copilot telemetry (Feature 4 · analytics). Lightweight in-memory counters for
 * tool usage, tool errors, latency (p-style avg), and token cost — the Lumina
 * pattern (KV counters, here in-memory per instance). Pure + injectable store so
 * it tests deterministically; swap the store for Redis/PostHog at activation.
 */

export interface TelemetryStore {
  toolInvocations: Map<string, number>;
  toolErrors: Map<string, number>;
  latencies: number[];
  tokenCost: number;
}

export function createTelemetryStore(): TelemetryStore {
  return {
    toolInvocations: new Map(),
    toolErrors: new Map(),
    latencies: [],
    tokenCost: 0,
  };
}

const defaultStore = createTelemetryStore();

export function recordToolInvocation(
  name: string,
  store: TelemetryStore = defaultStore,
): void {
  store.toolInvocations.set(name, (store.toolInvocations.get(name) ?? 0) + 1);
}

export function recordToolError(
  name: string,
  store: TelemetryStore = defaultStore,
): void {
  store.toolErrors.set(name, (store.toolErrors.get(name) ?? 0) + 1);
}

export function recordLatency(
  ms: number,
  store: TelemetryStore = defaultStore,
): void {
  store.latencies.push(Math.max(0, ms));
}

export function recordTokenCost(
  tokens: number,
  store: TelemetryStore = defaultStore,
): void {
  store.tokenCost += Math.max(0, tokens);
}

export interface TelemetrySnapshot {
  readonly toolInvocations: Record<string, number>;
  readonly toolErrors: Record<string, number>;
  readonly avgLatencyMs: number;
  readonly totalTokenCost: number;
}

export function snapshot(
  store: TelemetryStore = defaultStore,
): TelemetrySnapshot {
  const avg =
    store.latencies.length === 0
      ? 0
      : Math.round(
          store.latencies.reduce((a, b) => a + b, 0) / store.latencies.length,
        );
  return {
    toolInvocations: Object.fromEntries(store.toolInvocations),
    toolErrors: Object.fromEntries(store.toolErrors),
    avgLatencyMs: avg,
    totalTokenCost: store.tokenCost,
  };
}
