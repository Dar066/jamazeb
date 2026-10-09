"use client";

import { categories, products, type CategorySlug } from "../catalog";
import { createLocalStore } from "../local-store";

// Product list as the admin sees it: the catalogue plus edits made in the
// dashboard. In the demo, edits are kept in this browser and don't change the
// shop pages; in Phase 6 saving writes to the database and the shop updates.

export type AdminProduct = {
  slug: string;
  name: string;
  /** Main collection (not New In or Sale, which are automatic). */
  category: CategorySlug;
  /** Regular price. */
  price: number;
  /** Lower price while on sale; empty when not on sale. */
  salePrice: number | null;
  stock: number;
  status: "active" | "draft";
  colours: string[];
  sizes: string[];
  description: string;
  tone: string;
  /** Added in the dashboard rather than coming from the catalogue. */
  added?: boolean;
};

export const editableCategories = categories.filter((c) => c.slug !== "new-in" && c.slug !== "sale");
export const LOW_STOCK = 5;

function fromCatalogue(): AdminProduct[] {
  return products.map((p) => ({
    slug: p.slug,
    name: p.name,
    category: p.categories.find((c) => c !== "new-in" && c !== "sale") ?? "lawn",
    price: p.compareAtPrice ?? p.price,
    salePrice: p.compareAtPrice ? p.price : null,
    stock: p.stock,
    status: "active",
    colours: p.colours.map((c) => c.name),
    sizes: p.sizes ?? [],
    description: p.description,
    tone: p.tone,
  }));
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

/** URL-friendly name: "Printed Lawn Suit, Sage" → "printed-lawn-suit-sage". */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
