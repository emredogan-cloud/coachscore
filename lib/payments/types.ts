/**
 * Payment provider abstraction (Phase 4). Callers depend only on this interface;
 * the Stripe implementation is swapped in at activation. No fake credentials and
 * no fabricated calls — without Stripe keys the `NotConfigured` provider throws.
 */

export interface CheckoutInput {
  readonly productName: string;
  readonly unitAmountCents: number;
  readonly currency: string;
  readonly quantity: number;
  readonly successUrl: string;
  readonly cancelUrl: string;
  /** Our order id, echoed back on the session (reconciliation). */
  readonly clientReferenceId?: string;
  readonly customerEmail?: string;
}

export interface CheckoutSession {
  readonly sessionId: string;
  readonly url: string;
}

export interface PaymentProvider {
  createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession>;
}
