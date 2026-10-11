// Reads products from Shopify and turns them into the shop's Product shape, so
// every page, the cart and checkout work unchanged. How a Shopify product maps:
//
//   handle → web address        title, description, product type → name, text, type
//   "Colour"/"Color" option → colours (swatch colour if set)   "Size" option → sizes
//   collections or tags named lawn, unstitched, ready-to-wear, dupattas, new-in → collections
//   tag "stitchable" → offer stitching    tag "fabric:Chiffon" or metafield custom.fabric → fabric
//   metafields custom.details / custom.care (list or one per line) → product details and care
//   lowest variant price → price (compare-at price → sale)    stock → sum of the variants' stock
//
// Products appear only when published to the Headless channel (the token's channel).

import { categories, products as builtIn, type CategorySlug, type Product } from "../catalog";
import { storefront } from "./client";

const FABRICS: Product["fabric"][] = ["Lawn", "Cambric", "Chiffon", "Khaddar", "Linen"];
const COLLECTIONS = new Set<string>(categories.map((c) => c.slug).filter((s) => s !== "sale"));
/** Without a "new-in" collection, the newest products count as New In. */
const NEWEST_COUNT = 8;
/** Stock shown for an available variant without a count (not tracked, or the token can't read it). */
const UNKNOWN_STOCK = 99;
const MAX_PRODUCTS = 1000;

type Variant = {
  id: string;
  sku: string | null;
  availableForSale: boolean;
  quantityAvailable?: number | null;
  price: { amount: string };
  compareAtPrice: { amount: string } | null;
  selectedOptions: { name: string; value: string }[];
};

type ShopifyProduct = {
  handle: string;
  title: string;
  description: string;
  productType: string;
  tags: string[];
  collections: { nodes: { handle: string }[] };
  options: { name: string; optionValues: { name: string; swatch: { color: string | null } | null }[] }[];
  images: { nodes: { url: string; altText: string | null }[] };
  metafields: ({ key: string; value: string } | null)[];
  variants: { nodes: Variant[] };
};

const fields = (withStock: boolean) => `
  handle title description productType tags
  collections(first: 20) { nodes { handle } }
  options { name optionValues { name swatch { color } } }
  images(first: 6) { nodes { url altText } }
  metafields(identifiers: [
    { namespace: "custom", key: "fabric" },
    { namespace: "custom", key: "details" },
    { namespace: "custom", key: "care" }
  ]) { key value }
  variants(first: 100) {
    nodes {
      id sku availableForSale ${withStock ? "quantityAvailable" : ""}
      price { amount } compareAtPrice { amount }
      selectedOptions { name value }
    }
  }`;

const listQuery = (withStock: boolean) => `
  query JamazebProducts($after: String) {
    products(first: 100, after: $after, sortKey: CREATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      nodes { ${fields(withStock)} }
    }
  }`;

const oneQuery = `
  query JamazebProduct($handle: String!) {
    product(handle: $handle) {
      options { name }
      variants(first: 100) { nodes { id selectedOptions { name value } } }
    }
  }`;

// The token may not be allowed to read stock levels (Storefront permission
// "Read product inventory"). Then products show as simply available or sold out.
let canReadStock = true;

/** Every product on the Headless channel, newest first, as shop products. */
export async function listShopifyProducts(): Promise<Product[]> {
  const nodes: ShopifyProduct[] = [];
  let after: string | null = null;
  do {
    type Page = { products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: ShopifyProduct[] } };
    let page: Page;
    try {
      page = await storefront<Page>(listQuery(canReadStock), { after });
    } catch (error) {
      if (!canReadStock || !/quantityAvailable|unauthenticated_read_product_inventory|ACCESS_DENIED/i.test(String(error))) throw error;
      console.warn("The Shopify token can't read stock levels; showing products as available or sold out.");
      canReadStock = false;
      page = await storefront<Page>(listQuery(false), { after });
    }
    nodes.push(...page.products.nodes);
    after = page.products.pageInfo.hasNextPage ? page.products.pageInfo.endCursor : null;
  } while (after && nodes.length < MAX_PRODUCTS);

  const anyNewIn = nodes.some((n) => groupsOf(n).has("new-in"));
  return nodes.filter((n) => n.variants.nodes.length > 0).map((n, i) => toProduct(n, i, !anyNewIn && i < NEWEST_COUNT));
}

/** The Shopify variant (gid) an order line refers to, matched on colour and size. */
export async function findVariantIds(slugs: string[]): Promise<Map<string, (colour: string, size: string) => string | null>> {
  const found = new Map<string, (colour: string, size: string) => string | null>();
  for (const slug of new Set(slugs)) {
    type One = { product: { options: { name: string }[]; variants: { nodes: Pick<Variant, "id" | "selectedOptions">[] } } | null };
    const { product } = await storefront<One>(oneQuery, { handle: slug });
    if (!product) {
      found.set(slug, () => null);
      continue;
    }
    const colourName = product.options.find((o) => isColour(o.name))?.name;
    const sizeName = product.options.find((o) => isSize(o.name))?.name;
    found.set(slug, (colour, size) => {
      const match = product.variants.nodes.find((v) => {
        const value = (name?: string) => v.selectedOptions.find((o) => o.name === name)?.value;
        return (!colourName || value(colourName) === colour) && (!sizeName || value(sizeName) === size);
      });
      return match?.id ?? null;
    });
  }
  return found;
}

// ---- Mapping ----

const isColour = (name: string) => /^colou?r$/i.test(name.trim());
const isSize = (name: string) => /^size$/i.test(name.trim());
const money = (m: { amount: string } | null | undefined) => (m ? Math.round(Number(m.amount)) : 0);
const knownHex = new Map(builtIn.flatMap((p) => p.colours).map((c) => [c.name.toLowerCase(), c.hex]));

function groupsOf(n: ShopifyProduct): Set<string> {
  const names = [...n.collections.nodes.map((c) => c.handle), ...n.tags.map((t) => t.trim().toLowerCase())];
  return new Set(names.filter((h) => COLLECTIONS.has(h)));
}

function metafield(n: ShopifyProduct, key: string): string {
  return n.metafields.find((m) => m?.key === key)?.value ?? "";
}

/** A list metafield arrives as JSON (["a","b"]); a text one as lines. */
function lines(value: string): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // plain text
  }
  return value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

function guessCollection(n: ShopifyProduct): CategorySlug {
  const text = `${n.title} ${n.productType}`.toLowerCase();
  if (text.includes("dupatta")) return "dupattas";
  if (text.includes("unstitched")) return "unstitched";
  if (n.options.some((o) => isSize(o.name)) || /ready|kurta/.test(text)) return "ready-to-wear";
  return "lawn";
}

function fabricOf(n: ShopifyProduct): Product["fabric"] {
  const tag = n.tags.find((t) => /^fabric:/i.test(t))?.slice(7).trim();
  const candidates = [metafield(n, "fabric"), tag ?? "", n.productType, n.title];
  for (const text of candidates) {
    const hit = FABRICS.find((f) => text.toLowerCase().includes(f.toLowerCase()));
    if (hit) return hit;
  }
  return "Lawn";
}

function toProduct(n: ShopifyProduct, index: number, newest: boolean): Product {
  const variants = n.variants.nodes;
  const cheapest = variants.reduce((a, b) => (money(b.price) < money(a.price) ? b : a));
  const price = money(cheapest.price);
  const compareAt = money(cheapest.compareAtPrice);

  const groups = groupsOf(n);
  // Every product needs a main collection (breadcrumbs, admin): guess one when none is set.
  if (![...groups].some((g) => g !== "new-in")) groups.add(guessCollection(n));
  if (newest) groups.add("new-in");
  const productCategories = [...groups] as CategorySlug[];
  const main = productCategories.find((c) => c !== "new-in") ?? productCategories[0];
  const tone = categories.find((c) => c.slug === main)?.tone ?? "#E4DDCD";

  const colourOption = n.options.find((o) => isColour(o.name));
  const sizeOption = n.options.find((o) => isSize(o.name));
  const colours = colourOption
    ? colourOption.optionValues.map((v) => ({ name: v.name, hex: v.swatch?.color || knownHex.get(v.name.toLowerCase()) || "#CFC8B8" }))
    : [{ name: "As shown", hex: tone }];

  // Available with no count left = Shopify doesn't track it, or keeps selling when out of stock.
  const stock = variants.reduce((sum, v) => {
    if (!v.availableForSale) return sum;
    const count = typeof v.quantityAvailable === "number" ? v.quantityAvailable : 0;
    return sum + (count > 0 ? count : UNKNOWN_STOCK);
  }, 0);

  return {
    slug: n.handle,
    sku: cheapest.sku || n.handle,
    name: n.title,
    type: n.productType,
    fabric: fabricOf(n),
    categories: productCategories,
    price,
    ...(compareAt > price ? { compareAtPrice: compareAt } : {}),
    colours,
    ...(sizeOption ? { sizes: sizeOption.optionValues.map((v) => v.name) } : {}),
    ...(n.tags.some((t) => t.trim().toLowerCase() === "stitchable") ? { stitchable: true } : {}),
    description: n.description,
    details: lines(metafield(n, "details")),
    care: lines(metafield(n, "care")),
    images: n.images.nodes.map((img) => ({ src: img.url, alt: img.altText || n.title })),
    tone,
    newness: index + 1,
    stock,
  };
}
