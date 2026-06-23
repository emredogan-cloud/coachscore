/**
 * Cloudflare R2 storage adapter (Phase 3) — NOT activated.
 *
 * Implements the same `StorageAdapter` interface as the local adapter, against
 * a minimal S3-compatible client that is INJECTED at activation (so no AWS SDK
 * dependency is pulled in now, and no fake credentials are used). `createR2Adapter`
 * refuses to build until the R2 credentials are present. This is the real
 * third-party I/O boundary — exercised once R2 is provisioned, not in unit tests.
 */

import { isStorageConfigured } from '@/lib/activation';
import { requireEnv } from '@/lib/env';
import type { PutOptions, StorageAdapter, UploadRef } from './types';

/** The slice of an S3/R2 client the adapter needs; satisfied by aws-sdk/aws4fetch. */
export interface S3LikeClient {
  putObject(input: {
    bucket: string;
    key: string;
    body: Uint8Array;
    contentType: string;
  }): Promise<{ etag?: string }>;
  getObject(input: { bucket: string; key: string }): Promise<Uint8Array | null>;
  deleteObject(input: { bucket: string; key: string }): Promise<void>;
  headObject(input: { bucket: string; key: string }): Promise<boolean>;
}

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      'R2 storage is not activated: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, ' +
        'R2_SECRET_ACCESS_KEY and R2_BUCKET to enable uploads.',
    );
    this.name = 'StorageNotConfiguredError';
  }
}

export class R2StorageAdapter implements StorageAdapter {
  constructor(
    private readonly client: S3LikeClient,
    private readonly bucket: string = requireEnv('R2_BUCKET'),
  ) {}

  async put(
    key: string,
    data: Uint8Array,
    options: PutOptions,
  ): Promise<UploadRef> {
    const { etag } = await this.client.putObject({
      bucket: this.bucket,
      key,
      body: data,
      contentType: options.contentType,
    });
    return {
      key,
      contentType: options.contentType,
      byteSize: data.byteLength,
      etag,
    };
  }

  async get(key: string): Promise<Uint8Array | null> {
    return this.client.getObject({ bucket: this.bucket, key });
  }

  async delete(key: string): Promise<void> {
    await this.client.deleteObject({ bucket: this.bucket, key });
  }

  async exists(key: string): Promise<boolean> {
    return this.client.headObject({ bucket: this.bucket, key });
  }
}

/** Build the production R2 adapter; throws until R2 credentials are present. */
export function createR2Adapter(client: S3LikeClient): R2StorageAdapter {
  if (!isStorageConfigured()) {
    throw new StorageNotConfiguredError();
  }
  return new R2StorageAdapter(client);
}
