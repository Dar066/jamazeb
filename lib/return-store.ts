"use client";

import { createLocalStore } from "./local-store";
import type { ReturnRequest, ReturnStatus } from "./returns";

// Exchange and refund requests sent from this browser. Moves to the database in Phase 6.
const store = createLocalStore<ReturnRequest[]>("jamazeb-returns", [], Array.isArray);

export const useReturns = store.useValue;

export function saveReturn(request: ReturnRequest) {
  store.set([request, ...store.get()].slice(0, 50));
}

export function setReturnStatus(id: string, status: ReturnStatus) {
  store.set(store.get().map((r) => (r.id === id ? { ...r, status, decidedAt: new Date().toISOString() } : r)));
}

export function replaceReturns(list: ReturnRequest[]) {
  store.set(list);
}

export const getReturns = store.get;

/** Adds or replaces requests by id (used when the database sends newer copies). */
export function upsertReturns(list: ReturnRequest[]) {
  if (list.length === 0) return;
  const byId = new Map(list.map((r) => [r.id, r]));
  const current = store.get();
  const updated = current.map((r) => byId.get(r.id) ?? r);
  const added = list.filter((r) => !current.some((c) => c.id === r.id));
  store.set([...added, ...updated]);
}
