import { describe, expect, it } from 'vitest';
import {
  ApiError,
  errorToResult,
  NotActivatedError,
  ValidationError,
} from '@/lib/api';

describe('errorToResult', () => {
  it('maps ValidationError to 422', () => {
    const r = errorToResult(new ValidationError('bad', { field: 'x' }));
    expect(r.status).toBe(422);
    expect(r.body.error.code).toBe('validation_error');
    expect(r.body.error.details).toEqual({ field: 'x' });
  });

  it('maps NotActivatedError to 503', () => {
    const r = errorToResult(new NotActivatedError('no creds'));
    expect(r.status).toBe(503);
    expect(r.body.error.code).toBe('not_activated');
    expect(r.body.error.message).toBe('no creds');
  });

  it('maps a generic ApiError using its status', () => {
    const r = errorToResult(new ApiError('internal_error', 418, 'teapot'));
    expect(r.status).toBe(418);
  });

  it('maps an unknown Error to 500 internal_error', () => {
    expect(errorToResult(new Error('boom')).status).toBe(500);
    expect(errorToResult('a string').body.error.code).toBe('internal_error');
  });
});
