"use client";

import { products } from "../catalog";
import { toAdminProduct, type AdminProduct } from "./product-mapping";
import { createLocalStore } from "../local-store";

// Demo (browser) mode only: the product list as the admin sees it, the
// catalogue plus edits kept in this browser. They don't change the shop pages.
// In database mode products are saved through /api/admin/products instead.

export type { AdminProduct } from "./product-mapping";
export { LOW_STOCK, editableCategories, slugify } from "./product-mapping";

function fromCatalogue(): AdminProduct[] {
  return products.map((p) => toAdminProduct(p));
}

type Saved = { edits: Record<string, AdminProduct>; added: AdminProduct[] };
const store = createLocalStore<Saved>("jamazeb-admin-products", { edits: {}, added: [] }, (v) => typeof v === "object" && v !== null && "edits" in v);

const base = fromCatalogue();
let lastSaved: Saved | null = null;
let lastList: AdminProduct[] = base;

/** Catalogue + edits + added products. Returns the same array until something changes. */
export function useAdminProducts(): AdminProduct[] {
  const saved = store.useValue();
  if (saved !== lastSaved) {
    lastSaved = saved;
    lastList = [...base.map((p) => saved.edits[p.slug] ?? p), ...saved.added];
  }
  return lastList;
}

export function saveProduct(product: AdminProduct) {
  const saved = store.get();
  if (product.added) {
    const exists = saved.added.some((p) => p.slug === product.slug);
    store.set({ ...saved, added: exists ? saved.added.map((p) => (p.slug === product.slug ? product : p)) : [...saved.added, product] });
  } else {
    store.set({ ...saved, edits: { ...saved.edits, [product.slug]: product } });
  }
}

/** True when anything was edited or added in the dashboard. */
export function useHasProductEdits(): boolean {
  const saved = store.useValue();
  return Object.keys(saved.edits).length > 0 || saved.added.length > 0;
}

export function resetProducts() {
  store.set({ edits: {}, added: [] });
}
