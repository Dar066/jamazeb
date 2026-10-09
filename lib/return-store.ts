"use client";

import { createLocalStore } from "./local-store";
import type { ReturnRequest } from "./returns";

// Exchange and refund requests sent from this browser. Moves to the database in Phase 6.
const store = createLocalStore<ReturnRequest[]>("jamazeb-returns", [], Array.isArray);

export const useReturns = store.useValue;

export function saveReturn(request: ReturnRequest) {
  store.set([request, ...store.get()].slice(0, 50));
}
