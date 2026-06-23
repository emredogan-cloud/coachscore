/**
 * API error model (Phase 3). A small typed hierarchy mapped to HTTP status +
 * a stable JSON error envelope, so routes and server actions report failures
 * consistently. Pure + framework-agnostic (no Next imports).
 */

export type ApiErrorCode =
  | 'validation_error'
  | 'not_activated'
  | 'internal_error';

export interface ApiErrorBody {
  readonly error: {
    readonly code: ApiErrorCode;
    readonly message: string;
    readonly details?: unknown;
  };
}

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toBody(): ApiErrorBody {
    return {
      error: { code: this.code, message: this.message, details: this.details },
    };
  }
}

/** 422 — the request body failed validation. */
export class ValidationError extends ApiError {
  constructor(message = 'Request validation failed', details?: unknown) {
    super('validation_error', 422, message, details);
  }
}

/** 503 — a credential-gated capability is implemented but not activated. */
export class NotActivatedError extends ApiError {
  constructor(message: string) {
    super('not_activated', 503, message);
  }
}

export interface ErrorResult {
  readonly status: number;
  readonly body: ApiErrorBody;
}

/** Map any thrown value to a status + JSON error envelope. */
export function errorToResult(err: unknown): ErrorResult {
  if (err instanceof ApiError) {
    return { status: err.status, body: err.toBody() };
  }
  const message = err instanceof Error ? err.message : 'Internal error';
  return { status: 500, body: { error: { code: 'internal_error', message } } };
}
