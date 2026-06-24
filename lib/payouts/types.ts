/**
 * Coach payout provider abstraction (Phase 5 — Stripe Connect). Callers depend
 * only on this interface; the Stripe Connect implementation activates with a
 * credential. No fake credentials, no fabricated transfers.
 */

export interface ConnectedAccount {
  readonly accountId: string;
  readonly status: string;
}

export interface AccountLink {
  readonly url: string;
}

export interface TransferInput {
  readonly destinationAccountId: string;
  readonly amountCents: number;
  readonly currency: string;
  readonly description?: string;
}

export interface TransferResult {
  readonly transferId: string;
}

export interface PayoutProvider {
  createConnectedAccount(input: {
    coachId: string;
    email?: string;
  }): Promise<ConnectedAccount>;
  createAccountLink(
    accountId: string,
    urls: { refreshUrl: string; returnUrl: string },
  ): Promise<AccountLink>;
  createTransfer(input: TransferInput): Promise<TransferResult>;
}
