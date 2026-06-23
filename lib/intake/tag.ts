/**
 * Tag intake path (Phase 3).
 *
 * Validates + canonicalizes the player tag, then asks the injected CoC API
 * adapter for the account. With the default `NotConfiguredCocAdapter` (no proxy
 * credentials) it returns a clean `notActivated` result; with a real adapter
 * the returned fields flow through the shared normalize + snapshot tail. No
 * network call is made in this module.
 */

import type { Goal } from '@/lib/core';
import {
  CocApiNotConfiguredError,
  InvalidPlayerTagError,
  NotConfiguredCocAdapter,
  parsePlayerTag,
  type CocApiAdapter,
} from './coc-adapter';
import { buildIntakeResult, failedResult } from './result';
import type { IntakeResult } from './types';

export interface TagIntakeDeps {
  readonly adapter: CocApiAdapter;
}

const defaultDeps: TagIntakeDeps = { adapter: new NotConfiguredCocAdapter() };

export async function intakeByTag(
  rawTag: string,
  goal: Goal,
  deps: TagIntakeDeps = defaultDeps,
): Promise<IntakeResult> {
  let tag: string;
  try {
    tag = parsePlayerTag(rawTag);
  } catch (err) {
    if (err instanceof InvalidPlayerTagError) {
      return failedResult('tag', [err.message]);
    }
    throw err;
  }

  try {
    const data = await deps.adapter.fetchAccount(tag);
    return buildIntakeResult('tag', data.fields, goal, { note: tag });
  } catch (err) {
    if (err instanceof CocApiNotConfiguredError) {
      return failedResult('tag', [err.message], true);
    }
    return failedResult('tag', [
      err instanceof Error ? err.message : 'Tag intake failed.',
    ]);
  }
}
