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
