/**
 * Resend email provider (Phase 4) — the real HTTP I/O boundary, NOT activated.
 *
 * Sends via the Resend REST API with `fetch` (no SDK). `createResendProvider`
 * refuses to build until `RESEND_API_KEY` is present. Exercised once Resend is
 * provisioned; not unit-tested (the delivery pipeline injects a fake provider).
 */

import { isEmailConfigured } from '@/lib/activation';
import { optionalEnv, requireEnv } from '@/lib/env';
import type { EmailMessage, EmailProvider, SendResult } from './types';

export class EmailNotConfiguredError extends Error {
  constructor() {
    super(
      'Resend email is not activated: set RESEND_API_KEY (and optionally ' +
        'RESEND_FROM_EMAIL) to enable delivery.',
    );
    this.name = 'EmailNotConfiguredError';
  }
}

export class NotConfiguredEmailProvider implements EmailProvider {
  async send(): Promise<SendResult> {
    throw new EmailNotConfiguredError();
  }
}

const RESEND_URL = 'https://api.resend.com/emails';

export class ResendEmailProvider implements EmailProvider {
  constructor(
    private readonly apiKey: string = requireEnv('RESEND_API_KEY'),
    private readonly from: string = optionalEnv(
      'RESEND_FROM_EMAIL',
      'CoachScore <noreply@coachscore.app>',
    ),
  ) {}

  async send(message: EmailMessage): Promise<SendResult> {
    const response = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });
    if (!response.ok) {
      throw new Error(`Resend send failed: HTTP ${response.status}`);
    }
    const json = (await response.json()) as { id: string };
    return { id: json.id };
  }
}

/** Build the production Resend provider; throws until the key is set. */
export function createResendProvider(): EmailProvider {
  if (!isEmailConfigured()) {
    throw new EmailNotConfiguredError();
  }
  return new ResendEmailProvider();
}
