/**
 * Screenshot upload limits + validation (Feature 2 · P1-C). Pure guardrails for
 * the defense-completion upload flow: allowed image types, per-file + total size
 * caps, and a max file count — a cost/abuse control before any image reaches the
 * (paid) Anthropic Vision call. Returns structured errors; the UI surfaces them.
 */

export const UPLOAD_LIMITS = {
  maxFiles: 4,
  maxBytesPerFile: 6_000_000, // 6 MB
  maxTotalBytes: 16_000_000, // 16 MB
  allowedTypes: ['image/png', 'image/jpeg', 'image/webp'] as const,
} as const;

export interface UploadCandidate {
  readonly name: string;
  readonly type: string;
  readonly size: number;
}

export interface UploadValidation {
  readonly ok: boolean;
  readonly errors: readonly string[];
  readonly accepted: readonly UploadCandidate[];
}

function isAllowedType(type: string): boolean {
  return (UPLOAD_LIMITS.allowedTypes as readonly string[]).includes(type);
}

/** Validate a batch of candidate uploads against the limits. Pure. */
export function validateUpload(
  files: readonly UploadCandidate[],
): UploadValidation {
  const errors: string[] = [];
  if (files.length === 0) {
    return {
      ok: false,
      errors: ['Add at least one screenshot.'],
      accepted: [],
    };
  }
  if (files.length > UPLOAD_LIMITS.maxFiles) {
    errors.push(
      `Too many files — up to ${UPLOAD_LIMITS.maxFiles} screenshots.`,
    );
  }

  const accepted: UploadCandidate[] = [];
  let total = 0;
  for (const f of files) {
    if (!isAllowedType(f.type)) {
      errors.push(
        `${f.name || 'file'}: unsupported type (use PNG, JPEG, or WEBP).`,
      );
      continue;
    }
    if (f.size > UPLOAD_LIMITS.maxBytesPerFile) {
      errors.push(
        `${f.name || 'file'}: too large (max ${Math.round(
          UPLOAD_LIMITS.maxBytesPerFile / 1_000_000,
        )} MB each).`,
      );
      continue;
    }
    total += f.size;
    accepted.push(f);
  }

  if (total > UPLOAD_LIMITS.maxTotalBytes) {
    errors.push(
      `Total upload too large (max ${Math.round(
        UPLOAD_LIMITS.maxTotalBytes / 1_000_000,
      )} MB).`,
    );
  }

  const overCount = accepted.slice(0, UPLOAD_LIMITS.maxFiles);
  return {
    ok: errors.length === 0 && overCount.length > 0,
    errors,
    accepted: overCount,
  };
}
