"use client";

import { useSyncExternalStore } from "react";

// A small cart kept in the visitor's browser (localStorage). The cart and
// checkout pages in the next phase read and update this same store.

export type CartItem = {
  /** Unique per product + variant, so the same suit in two sizes is two lines. */
  key: string;
  slug: string;
  name: string;
  type: string;
  tone: string;
  /** Unit price in rupees, including any stitching charge. */
  price: number;
  qty: number;
  colour: string;
  /** "Unstitched", "Stitched" or empty for ready-to-wear. */
  option: string;
  size: string;
};

const STORAGE_KEY = "jamazeb-cart";
const MAX_QTY = 10;
const EMPTY: CartItem[] = [];

let items: CartItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    items = Array.isArray(parsed) ? parsed : [];
  } catch {
    items = [];
  }
}

function save(next: CartItem[]) {
  items = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing or storage full: the cart still works for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  // Keep tabs in sync when the cart changes in another tab.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      loaded = false;
      load();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  load();
  return items;
}

export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export function useCartCount(): number {
  return useCart().reduce((n, i) => n + i.qty, 0);
}

export function addToCart(item: Omit<CartItem, "key">) {
  load();
  const key = [item.slug, item.colour, item.option, item.size].join("|");
  const existing = items.find((i) => i.key === key);
  save(
    existing
      ? items.map((i) => (i.key === key ? { ...i, qty: Math.min(MAX_QTY, i.qty + item.qty) } : i))
      : [...items, { ...item, key, qty: Math.min(MAX_QTY, item.qty) }],
  );
}

export function setQuantity(key: string, qty: number) {
  save(items.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : i)));
}

export function removeFromCart(key: string) {
  save(items.filter((i) => i.key !== key));
}
