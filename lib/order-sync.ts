"use client";

// Keeps the orders saved on this device up to date with the database, so a
// status changed in the admin shows on the customer's phone too. In demo
// (browser) mode the server says so and these do nothing.

import { getOrders, mergeOrders } from "./order-store";
import type { Order } from "./orders";
import { upsertReturns } from "./return-store";
import type { ReturnRequest } from "./returns";

type Answer = { ok: true; order?: Order; orders?: Order[]; returns: ReturnRequest[] } | { ok: false; mode?: "browser"; error?: string };

async function post(url: string, body: unknown): Promise<Answer | null> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return (await res.json()) as Answer;
  } catch {
    return null;
  }
}

/**
 * Looks an order up in the database by number + mobile and saves it on this device.
 * Returns the order, "missing" when the database has no such order, or null in
 * browser mode / when the server can't be reached (then check this device instead).
 */
export async function lookupOrder(id: string, phone: string): Promise<Order | "missing" | null> {
  const answer = await post("/api/orders/lookup", { id, phone });
  if (!answer) return null;
  if (answer.ok && answer.order) {
    mergeOrders([answer.order]);
    upsertReturns(answer.returns);
    return answer.order;
  }
  return !answer.ok && answer.error === "not-found" ? "missing" : null;
}

/** Refreshes every order saved on this device (and their return requests). */
export async function syncLocalOrders(): Promise<void> {
  const mine = getOrders().filter((o) => !o.sample);
  if (mine.length === 0) return;
  const answer = await post("/api/orders/sync", { orders: mine.map((o) => ({ id: o.id, phone: o.customer.phone })) });
  if (answer?.ok) {
    mergeOrders(answer.orders ?? []);
    upsertReturns(answer.returns);
  }
}
