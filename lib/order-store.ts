"use client";

import { createLocalStore } from "./local-store";
import type { Order, OrderStatus } from "./orders";

// Orders placed from this browser. Moves to the database with customer accounts (Phase 6).
const store = createLocalStore<Order[]>("jamazeb-orders", [], Array.isArray);

export const useOrders = store.useValue;

export function getOrder(id: string): Order | undefined {
  return store.get().find((o) => o.id === id);
}

export function saveOrder(order: Order) {
  store.set([order, ...store.get().filter((o) => o.id !== order.id)].slice(0, 50));
}

export function updateOrder(id: string, change: (order: Order) => Order) {
  store.set(store.get().map((o) => (o.id === id ? change(o) : o)));
}

export function setOrderStatus(id: string, status: OrderStatus) {
  store.set(store.get().map((o) => (o.id === id ? { ...o, status } : o)));
}

export const getOrders = store.get;

export function replaceOrders(list: Order[]) {
  store.set(list);
}

/**
 * Takes newer copies of orders from the database: known orders are replaced in
 * place (keeping this device's payment link), new ones are added.
 */
export function mergeOrders(list: Order[]) {
  if (list.length === 0) return;
  const byId = new Map(list.map((o) => [o.id, o]));
  const current = store.get();
  const updated = current.map((o) => {
    const fresh = byId.get(o.id);
    return fresh ? { ...fresh, paymentUrl: o.paymentUrl ?? fresh.paymentUrl } : o;
  });
  const added = list.filter((o) => !current.some((c) => c.id === o.id));
  store.set([...added, ...updated].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50));
}
