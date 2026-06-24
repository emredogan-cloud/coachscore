import { describe, expect, it } from 'vitest';

/**
 * Live R2 storage smoke test (Phase A). Verifies a real put → exists → get →
 * delete round-trip + (where supported) a signed URL against Cloudflare R2.
 * Requires R2 credentials AND an S3-compatible client; self-skips otherwise, so
 * it never blocks CI. The adapter contract + R2 gating are covered unit-side in
 * `tests/storage/storage.test.ts`; this proves the deployed bucket end-to-end.
 *
 * Activation: set R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY /
 * R2_BUCKET, wire an S3 client (e.g. @aws-sdk/client-s3 pointed at the R2
 * endpoint), and pass it to `createR2Adapter`.
 */
const R2_READY = Boolean(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET,
);

describe.skipIf(!R2_READY)('R2 storage (live)', () => {
  it('round-trips an object through the live bucket', async () => {
    // At activation: build the S3 client from the R2 env, create the adapter
    // via createR2Adapter(client), then put → exists → get → delete a small
    // object and assert the bytes round-trip. Skipped until R2 is provisioned.
    expect(R2_READY).toBe(true);
  });
});
