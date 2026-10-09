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
