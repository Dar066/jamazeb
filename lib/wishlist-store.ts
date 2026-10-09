"use client";

import { createLocalStore } from "./local-store";

// Saved products (by slug), kept in the visitor's browser.
const store = createLocalStore<string[]>("jamazeb-wishlist", [], Array.isArray);

export const useWishlist = store.useValue;

export function toggleWishlist(slug: string) {
  const list = store.get();
  store.set(list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]);
}
