/**
 * Clash of Clans API adapter interface (Phase 3 — tag intake path).
 *
 * The official API is non-commercial and IP-whitelisted, so it is reached only
 * through a fixed-IP compliant proxy and is ONE OF THREE intake paths, never the
 * sole dependency (ADR 0006). No real call is made here: this file defines the
 * adapter contract, a player-tag parser, and a `NotConfigured` adapter that
 * fails loudly until `COC_API_TOKEN` + `COC_API_PROXY_URL` are provisioned.
 */

import type { IntakeFields } from './types';

/** What the adapter returns: a canonical tag + already-mapped intake fields. */
export interface CocAccountData {
  readonly playerTag: string;
  readonly fields: IntakeFields;
}

/** The swappable adapter contract; a real proxy client implements this. */
export interface CocApiAdapter {
  fetchAccount(playerTag: string): Promise<CocAccountData>;
}

export class InvalidPlayerTagError extends Error {
  constructor(raw: string) {
    super(`Invalid Clash of Clans player tag: "${raw}".`);
    this.name = 'InvalidPlayerTagError';
  }
}

export class CocApiNotConfiguredError extends Error {
  constructor() {
    super(
      'CoC API tag intake is not activated: set COC_API_TOKEN and ' +
        'COC_API_PROXY_URL (fixed-IP proxy) to enable it.',
    );
    this.name = 'CocApiNotConfiguredError';
  }
}

// Clash of Clans tags use this restricted alphabet.
const TAG_BODY = /^[0289PYLQGRJCUV]{3,12}$/;

/** Canonicalize + validate a player tag to the `#XXXX` form, or throw. */
export function parsePlayerTag(raw: string): string {
  const body = raw.trim().toUpperCase().replace(/^#/, '');
  if (!TAG_BODY.test(body)) {
    throw new InvalidPlayerTagError(raw);
  }
  return `#${body}`;
}

/** The default adapter until the proxy is provisioned — always fails loudly. */
export class NotConfiguredCocAdapter implements CocApiAdapter {
  async fetchAccount(_playerTag: string): Promise<CocAccountData> {
    throw new CocApiNotConfiguredError();
  }
}
