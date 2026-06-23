/**
 * Email provider abstraction (Phase 4). The delivery pipeline depends only on
 * this interface; the Resend implementation activates with a credential. No
 * fake sends — without a key the `NotConfigured` provider throws.
 */

export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

export interface SendResult {
  readonly id: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<SendResult>;
}
