// How a product looks in the admin form, and how a saved form becomes a shop
// product. Shared by the browser (demo mode) and the server (database mode),
// so both apply the same rules.

import { categories, type CategorySlug, type Product } from "../catalog";

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
  /** Added in the dashboard rather than coming from the original catalogue. */
  added?: boolean;
};

export const editableCategories = categories.filter((c) => c.slug !== "new-in" && c.slug !== "sale");
const EDITABLE = new Set(editableCategories.map((c) => c.slug));
export const LOW_STOCK = 5;

export function mainCategory(p: Product): CategorySlug {
  return p.categories.find((c) => EDITABLE.has(c)) ?? "lawn";
}

export function toAdminProduct(p: Product, status: "active" | "draft" = "active", added = false): AdminProduct {
  return {
    slug: p.slug,
    name: p.name,
    category: mainCategory(p),
    price: p.compareAtPrice ?? p.price,
    salePrice: p.compareAtPrice ? p.price : null,
    stock: p.stock,
    status,
    colours: p.colours.map((c) => c.name),
    sizes: p.sizes ?? [],
    description: p.description,
    tone: p.tone,
    added,
  };
}

/** "Printed Lawn Suit, Sage" → "printed-lawn-suit-sage". */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export type ProductErrors = Partial<Record<"name" | "price" | "salePrice" | "stock" | "colours" | "category", string>>;

export function validateAdminProduct(p: AdminProduct): ProductErrors {
  const errors: ProductErrors = {};
  if (p.name.trim().length < 3 || p.name.length > 80) errors.name = "Enter a product name (3–80 characters).";
  if (!slugify(p.name)) errors.name = "Use letters or numbers in the name.";
  if (!Number.isInteger(p.price) || p.price < 100 || p.price > 500000) errors.price = "Enter a whole price in rupees.";
  if (p.salePrice !== null && (!Number.isInteger(p.salePrice) || p.salePrice <= 0 || p.salePrice >= p.price)) {
    errors.salePrice = "Sale price must be lower than the price.";
  }
  if (!Number.isInteger(p.stock) || p.stock < 0 || p.stock > 100000) errors.stock = "Enter stock as a whole number.";
  if (p.colours.length === 0 || p.colours.length > 12 || p.colours.some((c) => c.length > 30)) errors.colours = "Add 1–12 colours.";
  if (!EDITABLE.has(p.category)) errors.category = "Choose a category.";
  return errors;
}

// Swatch colours for common colour names; others get a neutral swatch until edited.
const KNOWN_HEX: Record<string, string> = {
  sage: "#9DAE97", rust: "#A85A3C", ivory: "#EDE6D6", blush: "#E3C4BC", olive: "#7D8253", sand: "#D8C8A8",
  charcoal: "#3E3D3A", indigo: "#3F4E7A", black: "#1F1F1D", white: "#F7F5F0", teal: "#2F6F6A", maroon: "#6E2B30",
  mustard: "#C9A13B", pink: "#E7B7C2", blue: "#4C6A9A", green: "#4F7A55", grey: "#9A978F", gray: "#9A978F",
  beige: "#E3D6BF", navy: "#2A3550", red: "#A63A35", peach: "#F0C3A8", lilac: "#C7B6D8", mint: "#BFD8C8",
};

const TYPE_FOR: Partial<Record<CategorySlug, string>> = {
  lawn: "3-piece unstitched",
  unstitched: "3-piece unstitched",
  "ready-to-wear": "Ready to wear",
  dupattas: "Dupatta",
};

/**
 * Applies the admin form to a product: an edit keeps everything the form
 * doesn't show (photos, details, care, fabric…); a new product gets sensible
 * defaults and appears in New In.
 */
export function applyAdminProduct(a: AdminProduct, existing: Product | undefined, all: Product[]): Product {
  const onSale = a.salePrice !== null;
  const colours = a.colours.map((name) => {
    const old = existing?.colours.find((c) => c.name.toLowerCase() === name.toLowerCase());
    return { name, hex: old?.hex ?? KNOWN_HEX[name.toLowerCase()] ?? "#CFC9BB" };
  });
  const sizes = a.sizes.length > 0 ? a.sizes : undefined;

  if (existing) {
    const oldMain = mainCategory(existing);
    const cats = existing.categories.filter((c) => c !== "sale" && c !== oldMain);
    return {
      ...existing,
      name: a.name.trim(),
      price: onSale ? a.salePrice! : a.price,
      compareAtPrice: onSale ? a.price : undefined,
      stock: a.stock,
      colours,
      sizes,
      description: a.description.trim() || existing.description,
      categories: [a.category, ...cats.filter((c) => c !== a.category)],
    };
  }

  const newest = Math.min(0, ...all.map((p) => p.newness)) - 1;
  return {
    slug: a.slug,
    sku: `JZ-NW-${String(Date.now()).slice(-4)}`,
    name: a.name.trim(),
    type: TYPE_FOR[a.category] ?? "Clothing",
    fabric: a.category === "dupattas" ? "Chiffon" : "Lawn",
    categories: ["new-in", a.category],
    price: onSale ? a.salePrice! : a.price,
    compareAtPrice: onSale ? a.price : undefined,
    colours,
    sizes,
    description: a.description.trim() || `${a.name.trim()}, new this season.`,
    details: [],
    care: ["Hand wash cold or dry clean", "Iron on medium heat", "Dry in shade"],
    tone: a.tone || "#E4DDCD",
    newness: newest,
    stock: a.stock,
  };
}
