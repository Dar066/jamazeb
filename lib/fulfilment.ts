// What happens to an order after it is placed, and the rules that depend on it
// (tracking, exchange window). Shared by the track page, account and returns.
// In the demo, steps move forward with a button on the track page; in Phase 5
// the admin dashboard moves them, and a real courier API can do the same later.

import type { Order } from "./orders";
import { site } from "./site";

export const FULFILMENT_STEPS = [
  { label: "Order placed", detail: "We received your order." },
  { label: "Order confirmed", detail: "We confirmed your order on WhatsApp." },
  { label: "Packed & booked with courier", detail: "Your parcel is packed and handed to the courier." },
  { label: "In transit", detail: "On the way to your city." },
  { label: "Out for delivery", detail: "The rider will call before arriving." },
  { label: "Delivered", detail: "Your parcel has been delivered." },
] as const;

export const DELIVERED_STEP = FULFILMENT_STEPS.length - 1;
const BOOKED_STEP = 2;
const DAY = 24 * 60 * 60 * 1000;

/** True for orders that will be delivered: cash on delivery, or paid online. */
export function isActiveOrder(order: Order): boolean {
  return order.status === "awaiting-confirmation" || order.status === "paid";
}

export function currentStep(order: Order): number {
  return order.fulfilment?.step ?? 0;
}

/** Date each step was reached, or undefined if not reached yet. */
export function stepTime(order: Order, step: number): string | undefined {
  if (step === 0) return order.createdAt;
  return order.fulfilment?.times[step];
}

/** Customer-facing status: payment problems first, then delivery progress. */
export function displayStatus(order: Order): string {
  switch (order.status) {
    case "awaiting-payment":
      return "Payment not completed";
    case "payment-failed":
      return "Payment declined";
    case "payment-cancelled":
      return "Payment cancelled";
    case "cancelled":
      return "Cancelled";
    default:
      return FULFILMENT_STEPS[currentStep(order)].label;
  }
}

/** Moves an order to the next step and records when. Returns the updated order. */
export function advanceFulfilment(order: Order, now = new Date()): Order {
  const step = Math.min(currentStep(order) + 1, DELIVERED_STEP);
  const times = [...(order.fulfilment?.times ?? [order.createdAt])];
  times[step] = now.toISOString();
  const trackingNumber =
    order.fulfilment?.trackingNumber ?? (step >= BOOKED_STEP ? `TRK-${order.id.slice(3)}` : undefined);
  return { ...order, fulfilment: { step, times, trackingNumber } };
}

export type ReturnEligibility =
  | { eligible: true; deliveredAt: string; closesAt: string; daysLeft: number }
  | { eligible: false; reason: "not-active" | "not-delivered" | "expired"; deliveredAt?: string; closesAt?: string };

/** Exchanges and refunds are open for `site.exchangeWindowDays` days after delivery. */
export function returnEligibility(order: Order, now = new Date()): ReturnEligibility {
  if (!isActiveOrder(order)) return { eligible: false, reason: "not-active" };
  const deliveredAt = stepTime(order, DELIVERED_STEP);
  if (currentStep(order) < DELIVERED_STEP || !deliveredAt) return { eligible: false, reason: "not-delivered" };
  const closes = new Date(new Date(deliveredAt).getTime() + site.exchangeWindowDays * DAY);
  if (now > closes) return { eligible: false, reason: "expired", deliveredAt, closesAt: closes.toISOString() };
  const daysLeft = Math.max(1, Math.ceil((closes.getTime() - now.getTime()) / DAY));
  return { eligible: true, deliveredAt, closesAt: closes.toISOString(), daysLeft };
}

/** Finds an order by number and the mobile number used at checkout. */
export function matchOrder(orders: Order[], id: string, phone: string | null): Order | undefined {
  const wanted = id.trim().toUpperCase();
  return orders.find((o) => o.id === wanted && (phone === null || o.customer.phone === phone));
}
