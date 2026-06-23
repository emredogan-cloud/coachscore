/**
 * Storage abstraction (Phase 3).
 *
 * A narrow `StorageAdapter` interface backs screenshot/PDF/share-card uploads.
 * The in-memory `local` adapter ships for dev/test; the `r2` adapter implements
 * the same interface against Cloudflare R2 (zero-egress) and activates when the
 * R2 credentials are present. Callers depend only on this interface.
 */

export type UploadScope = 'screenshot' | 'pdf' | 'share_card';

export interface PutOptions {
  readonly contentType: string;
}

export interface UploadRef {
  readonly key: string;
  readonly contentType: string;
  readonly byteSize: number;
  readonly etag?: string;
}

export interface StorageAdapter {
  put(key: string, data: Uint8Array, options: PutOptions): Promise<UploadRef>;
  get(key: string): Promise<Uint8Array | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
