import type { Order, OrderStatus } from "../orders";
import type { PaymentOutcome } from "../payments/types";

const STATUS_FOR: Record<PaymentOutcome, OrderStatus> = {
  paid: "paid",
  failed: "payment-failed",
  cancelled: "payment-cancelled",
};

/**
 * The order after a verified payment result, or null when nothing should change:
 * a paid or cancelled order never goes back to unpaid, e.g. if an old result page is reopened.
 */
export function applyPaymentResult(order: Order, amount: number, outcome: PaymentOutcome): Order | null {
  if (order.payment !== "payfast" || order.total !== amount) return null;
  if (order.status === "paid" || order.status === "cancelled") return null;
  return { ...order, status: STATUS_FOR[outcome] };
}
