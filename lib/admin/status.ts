// How orders appear and move forward in the admin dashboard.

import { DELIVERED_STEP, advanceFulfilment, currentStep } from "../fulfilment";
import type { Order } from "../orders";

export type AdminStage = "to-confirm" | "confirmed" | "booked" | "in-transit" | "out-for-delivery" | "delivered" | "unpaid" | "cancelled";

export function adminStage(order: Order): AdminStage {
  if (order.status === "cancelled") return "cancelled";
  if (order.status !== "awaiting-confirmation" && order.status !== "paid") return "unpaid";
  return (["to-confirm", "confirmed", "booked", "in-transit", "out-for-delivery", "delivered"] as const)[currentStep(order)];
}

export const stageLabels: Record<AdminStage, string> = {
  "to-confirm": "To confirm",
  confirmed: "Confirmed",
  booked: "Booked with courier",
  "in-transit": "In transit",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
  unpaid: "Not paid",
  cancelled: "Cancelled",
};

/** Badge style per stage. The text label always says the status; colour only supports it. */
export const stageBadge: Record<AdminStage, string> = {
  "to-confirm": "bg-rust-soft text-rust",
  confirmed: "bg-sand text-charcoal",
  booked: "bg-sand text-charcoal",
  "in-transit": "bg-sand text-charcoal",
  "out-for-delivery": "bg-sand text-charcoal",
  delivered: "bg-emerald-soft text-emerald",
  unpaid: "bg-white text-muted ring-1 ring-line-strong ring-inset",
  cancelled: "bg-white text-muted ring-1 ring-line-strong ring-inset",
};

const NEXT_ACTION = ["Confirm order", "Book courier", "Mark in transit", "Mark out for delivery", "Mark delivered"];

/** Label of the button that moves the order on, or null when there is nothing to do. */
export function nextAction(order: Order): string | null {
  const stage = adminStage(order);
  if (stage === "unpaid" || stage === "cancelled") return null;
  const step = currentStep(order);
  return step < DELIVERED_STEP ? NEXT_ACTION[step] : null;
}

export function moveOn(order: Order): Order {
  return advanceFulfilment(order);
}

/** Orders still waiting for the store to do something. */
export const needsConfirming = (o: Order) => adminStage(o) === "to-confirm";
export const needsBooking = (o: Order) => adminStage(o) === "confirmed";
