/**
 * In-memory storage adapter — the local development / test adapter (Phase 3).
 *
 * Holds objects in a Map; sufficient for dev and unit tests without any cloud
 * dependency. Production uses the R2 adapter (`./r2`) which implements the same
 * `StorageAdapter` interface. No filesystem or network I/O.
 */

import type { PutOptions, StorageAdapter, UploadRef } from './types';

export class InMemoryStorageAdapter implements StorageAdapter {
  private readonly store = new Map<
    string,
    { data: Uint8Array; contentType: string }
  >();

  async put(
    key: string,
    data: Uint8Array,
    options: PutOptions,
  ): Promise<UploadRef> {
    this.store.set(key, { data, contentType: options.contentType });
    return { key, contentType: options.contentType, byteSize: data.byteLength };
  }

  async get(key: string): Promise<Uint8Array | null> {
    return this.store.get(key)?.data ?? null;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  /** Test/diagnostic helper: number of stored objects. */
  size(): number {
    return this.store.size;
  }
}
