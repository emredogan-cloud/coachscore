import { describe, expect, it, vi } from 'vitest';
import { InMemoryQueueStore, runJob } from '@/lib/queue';

const noSleep = () => Promise.resolve();

describe('runJob — durable execution', () => {
  it('completes a successful job on the first attempt', async () => {
    const store = new InMemoryQueueStore();
    const out = await runJob(
      async (n: number) => n * 2,
      21,
      { idempotencyKey: 'k1', sleep: noSleep },
      store,
    );
    expect(out.status).toBe('completed');
    expect(out.result).toBe(42);
    expect(out.attempts).toBe(1);
    expect(out.deduplicated).toBe(false);
  });

  it('retries then succeeds (bounded retries with injected backoff)', async () => {
    const store = new InMemoryQueueStore();
    let calls = 0;
    const handler = async () => {
      calls += 1;
      if (calls < 3) throw new Error('transient');
      return 'ok';
    };
    const out = await runJob(
      handler,
      null,
      { idempotencyKey: 'k2', sleep: noSleep },
      store,
    );
    expect(out.status).toBe('completed');
    expect(out.attempts).toBe(3);
    expect(calls).toBe(3);
  });

  it('dead-letters after exhausting attempts and invokes the hook', async () => {
    const store = new InMemoryQueueStore();
    const onDeadLetter = vi.fn();
    const out = await runJob(
      async () => {
        throw new Error('always fails');
      },
      null,
      { idempotencyKey: 'k3', maxAttempts: 2, sleep: noSleep, onDeadLetter },
      store,
    );
    expect(out.status).toBe('dead-letter');
    expect(out.attempts).toBe(2);
    expect(out.error).toContain('always fails');
    expect(onDeadLetter).toHaveBeenCalledOnce();
  });

  it('is idempotent: a completed key returns without re-running', async () => {
    const store = new InMemoryQueueStore();
    let calls = 0;
    const handler = async () => {
      calls += 1;
      return 'value';
    };
    const first = await runJob(
      handler,
      null,
      {
        idempotencyKey: 'dup',
        sleep: noSleep,
      },
      store,
    );
    const second = await runJob(
      handler,
      null,
      {
        idempotencyKey: 'dup',
        sleep: noSleep,
      },
      store,
    );

    expect(first.deduplicated).toBe(false);
    expect(second.deduplicated).toBe(true);
    expect(second.result).toBe('value');
    expect(calls).toBe(1); // handler ran only once
  });

  it('applies exponential backoff between attempts', async () => {
    const store = new InMemoryQueueStore();
    const delays: number[] = [];
    const sleep = (ms: number) => {
      delays.push(ms);
      return Promise.resolve();
    };
    await runJob(
      async () => {
        throw new Error('fail');
      },
      null,
      { idempotencyKey: 'backoff', maxAttempts: 3, baseDelayMs: 100, sleep },
      store,
    );
    // Two sleeps between three attempts: 100, 200.
    expect(delays).toEqual([100, 200]);
  });
});
