/**
 * Queue transport (Phase 8). The abstraction a Redis/QStash adapter implements
 * to hand a job to off-process workers. `InlineQueueTransport` runs the consumer
 * immediately (single-process default + tests); the network adapters are wired
 * at activation behind the same interface. Outbound network adapters live in
 * their own (coverage-excluded) files; this inline default is pure + testable.
 */

import type { QueueJobEnvelope, QueueTransport } from './types';

export class InlineQueueTransport implements QueueTransport {
  constructor(
    private readonly consume: (job: QueueJobEnvelope) => Promise<void>,
  ) {}
  async publish(job: QueueJobEnvelope): Promise<void> {
    await this.consume(job);
  }
}

/** A transport that only records what was published (tests / dry-run). */
export class RecordingQueueTransport implements QueueTransport {
  readonly published: QueueJobEnvelope[] = [];
  async publish(job: QueueJobEnvelope): Promise<void> {
    this.published.push(job);
  }
}
