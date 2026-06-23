import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  activationStatus,
  isAiConfigured,
  isCocApiConfigured,
  isDatabaseConfigured,
  isEmailConfigured,
  isPaymentsConfigured,
  isStorageConfigured,
} from '@/lib/activation';

const KEYS = [
  'DATABASE_URL',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'COC_API_TOKEN',
  'COC_API_PROXY_URL',
  'ANTHROPIC_API_KEY',
  'STRIPE_SECRET_KEY',
  'RESEND_API_KEY',
] as const;

const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe('activation gates', () => {
  it('reports everything inactive when no credentials are present', () => {
    expect(activationStatus()).toEqual({
      database: false,
      storage: false,
      cocApi: false,
      ai: false,
      payments: false,
      email: false,
    });
  });

  it('detects Stripe and Resend independently', () => {
    expect(isPaymentsConfigured()).toBe(false);
    expect(isEmailConfigured()).toBe(false);
    process.env.STRIPE_SECRET_KEY = 'sk_test_x';
    process.env.RESEND_API_KEY = 're_x';
    expect(isPaymentsConfigured()).toBe(true);
    expect(isEmailConfigured()).toBe(true);
  });

  it('treats empty/whitespace values as absent', () => {
    process.env.DATABASE_URL = '   ';
    expect(isDatabaseConfigured()).toBe(false);
    process.env.DATABASE_URL = 'postgres://localhost/db';
    expect(isDatabaseConfigured()).toBe(true);
  });

  it('requires ALL R2 vars before storage is configured', () => {
    process.env.R2_ACCOUNT_ID = 'a';
    process.env.R2_ACCESS_KEY_ID = 'b';
    process.env.R2_SECRET_ACCESS_KEY = 'c';
    expect(isStorageConfigured()).toBe(false);
    process.env.R2_BUCKET = 'coachscore-media';
    expect(isStorageConfigured()).toBe(true);
  });

  it('requires both token and proxy for the CoC API', () => {
    process.env.COC_API_TOKEN = 'tok';
    expect(isCocApiConfigured()).toBe(false);
    process.env.COC_API_PROXY_URL = 'https://proxy.example';
    expect(isCocApiConfigured()).toBe(true);
  });

  it('detects the Anthropic key independently', () => {
    expect(isAiConfigured()).toBe(false);
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    expect(isAiConfigured()).toBe(true);
    expect(activationStatus().ai).toBe(true);
  });
});
