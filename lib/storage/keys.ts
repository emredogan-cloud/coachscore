/**
 * Deterministic storage-key construction (Phase 3). Pure: keys are a function
 * of their inputs only, so the same upload always maps to the same object path
 * (scope/owner/id.ext), and untrusted segments are sanitized to a safe charset.
 */

import type { UploadScope } from './types';

const UNSAFE = /[^a-zA-Z0-9._-]/g;

function sanitize(segment: string, fallback: string): string {
  const cleaned = segment.replace(UNSAFE, '');
  return cleaned.length > 0 ? cleaned : fallback;
}

export interface UploadKeyInput {
  readonly scope: UploadScope;
  readonly ownerId: string;
  readonly uploadId: string;
  readonly ext: string;
}

/** Build a deterministic object key: `scope/owner/uploadId.ext`. */
export function buildUploadKey(input: UploadKeyInput): string {
  const owner = sanitize(input.ownerId, 'anon');
  const id = sanitize(input.uploadId, 'upload');
  const ext = input.ext.replace(/^\./, '').replace(UNSAFE, '').toLowerCase();
  return `${input.scope}/${owner}/${id}${ext ? `.${ext}` : ''}`;
}
