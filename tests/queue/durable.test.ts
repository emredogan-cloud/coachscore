import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RETRY_POLICY,
  InlineQueueTransport,
  MemoryAsyncQueueStore,
  queueBackoff,
  RecordingQueueTransport,
  runDurableJob,
} from '@/lib/queue';

const noSleep = async () => {};

describe('queueBackoff', () => {
  it('grows exponentially and caps at maxDelayMs', () => {
    expect(queueBackoff(1, DEFAULT_RETRY_POLICY)).toBe(200);
    expect(queueBackoff(2, DEFAULT_RETRY_POLICY)).toBe(400);
    expect(queueBackoff(50, DEFAULT_RETRY_POLICY)).toBe(
      DEFAULT_RETRY_POLICY.maxDelayMs,
    );
  });
});

describe('MemoryAsyncQueueStore', () => {
  it('persists and lists by status', async () => {
    const store = new MemoryAsyncQueueStore();
    await store.set('k', {
      idempotencyKey: 'k',
      status: 'completed',
      attempts: 1,
      result: 42,
      error: null,
    });
    expect((await store.get<number>('k'))?.result).toBe(42);
    expect(await store.listByStatus('completed')).toHaveLength(1);
    expect(await store.listByStatus('failed')).toHaveLength(0);
  });
});

describe('runDurableJob', () => {
  it('completes and deduplicates on re-run under the same key', async () => {
    const store = new MemoryAsyncQueueStore();
    let calls = 0;
    const handler = async (x: number) => {
      calls += 1;
      return x * 2;
    };
    const first = await runDurableJob(
      handler,
      21,
      { idempotencyKey: 'j1' },
      store,
    );
    expect(first).toMatchObject({
      status: 'completed',
      result: 42,
      deduplicated: false,
    });

    const second = await runDurableJob(
      handler,
      21,
      { idempotencyKey: 'j1' },
      store,
    );
    expect(second).toMatchObject({ result: 42, deduplicated: true });
    expect(calls).toBe(1); // not re-run
  });

  it('retries transient failures then succeeds', async () => {
    const store = new MemoryAsyncQueueStore();
    let n = 0;
    const outcome = await runDurableJob(
      async () => {
        n += 1;
        if (n < 3) throw new Error('transient');
        return 'ok';
      },
      null,
      { idempotencyKey: 'j2', sleep: noSleep },
      store,
    );
    expect(outcome.status).toBe('completed');
    expect(outcome.attempts).toBe(3);
  });

  it('dead-letters after exhausting attempts and fires the hook', async () => {
    const store = new MemoryAsyncQueueStore();
    const deadLettered: string[] = [];
    const outcome = await runDurableJob(
      async () => {
        throw new Error('always fails');
      },
      null,
      {
        idempotencyKey: 'j3',
        sleep: noSleep,
        policy: { ...DEFAULT_RETRY_POLICY, maxAttempts: 2 },
        onDeadLetter: (key) => {
          deadLettered.push(key);
        },
      },
      store,
    );
    expect(outcome.status).toBe('dead-letter');
    expect(outcome.attempts).toBe(2);
    expect(deadLettered).toEqual(['j3']);
    expect(await store.listByStatus('dead-letter')).toHaveLength(1);
  });
});

describe('queue transport', () => {
  it('inline transport runs the consumer immediately', async () => {
    const seen: string[] = [];
    const transport = new InlineQueueTransport(async (job) => {
      seen.push(job.key);
    });
    await transport.publish({ key: 'a', kind: 'report_draft', payload: {} });
    expect(seen).toEqual(['a']);
  });

  it('recording transport captures published jobs', async () => {
    const transport = new RecordingQueueTransport();
    await transport.publish({
      key: 'b',
      kind: 'extraction',
      payload: { n: 1 },
    });
    expect(transport.published).toHaveLength(1);
    expect(transport.published[0]?.kind).toBe('extraction');
  });
});
