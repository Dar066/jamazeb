"use client";

import { createLocalStore } from "./local-store";
import { MAX_QTY } from "./orders";

// The visitor's cart, saved in their browser. Prices here are for display only:
// the server recalculates every price from the catalogue when an order is placed.

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

const store = createLocalStore<CartItem[]>("jamazeb-cart", [], Array.isArray);

export const useCart = store.useValue;

export function useCartCount(): number {
  return useCart().reduce((n, i) => n + i.qty, 0);
}

export function addToCart(item: Omit<CartItem, "key">) {
  const items = store.get();
  const key = [item.slug, item.colour, item.option, item.size].join("|");
  const existing = items.find((i) => i.key === key);
  store.set(
    existing
      ? items.map((i) => (i.key === key ? { ...i, qty: Math.min(MAX_QTY, i.qty + item.qty) } : i))
      : [...items, { ...item, key, qty: Math.min(MAX_QTY, item.qty) }],
  );
}

export function setQuantity(key: string, qty: number) {
  store.set(store.get().map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : i)));
}

export function removeFromCart(key: string) {
  store.set(store.get().filter((i) => i.key !== key));
}

export function clearCart() {
  store.set([]);
}
