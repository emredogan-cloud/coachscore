/**
 * Stripe event → order-transition mapping (Phase 4). Pure: translates the
 * webhook event types we care about into an intent the webhook handler applies.
 */

export interface StripeEventLike {
  readonly type: string;
  readonly data: { readonly object: Record<string, unknown> };
}

export type OrderEventKind =
  | 'paid'
  | 'refunded'
  | 'failed'
  | 'expired'
  | 'ignored';

export interface MappedEvent {
  readonly kind: OrderEventKind;
  readonly sessionId?: string;
  readonly paymentIntentId?: string;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function mapStripeEvent(event: StripeEventLike): MappedEvent {
  const obj = event.data.object;
  switch (event.type) {
    case 'checkout.session.completed':
      return {
        kind: 'paid',
        sessionId: str(obj.id),
        paymentIntentId: str(obj.payment_intent),
      };
    case 'checkout.session.expired':
      return { kind: 'expired', sessionId: str(obj.id) };
    case 'checkout.session.async_payment_failed':
      return {
        kind: 'failed',
        sessionId: str(obj.id),
        paymentIntentId: str(obj.payment_intent),
      };
    case 'charge.refunded':
    case 'refund.created':
      return { kind: 'refunded', paymentIntentId: str(obj.payment_intent) };
    default:
      return { kind: 'ignored' };
  }
}
