/**
 * Order state machine (Phase 4). Pure, explicit allowed transitions so order
 * status can never move illegally (e.g. a refunded order back to paid).
 */

import type { Order } from '@/lib/db';

export type OrderStatusValue = Order['status'];

export const ORDER_TRANSITIONS: Readonly<
  Record<OrderStatusValue, readonly OrderStatusValue[]>
> = {
  pending: ['paid', 'failed', 'expired'],
  paid: ['fulfilled', 'refunded'],
  fulfilled: ['refunded'],
  refunded: [],
  failed: [],
  expired: [],
};

export function canTransition(
  from: OrderStatusValue,
  to: OrderStatusValue,
): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export class InvalidOrderTransitionError extends Error {
  constructor(from: OrderStatusValue, to: OrderStatusValue) {
    super(`Invalid order transition: ${from} -> ${to}.`);
    this.name = 'InvalidOrderTransitionError';
  }
}

export function assertTransition(
  from: OrderStatusValue,
  to: OrderStatusValue,
): void {
  if (!canTransition(from, to)) {
    throw new InvalidOrderTransitionError(from, to);
  }
}
