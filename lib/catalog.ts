// Mock catalogue for the demo build. Later this file is replaced by a
// CommerceProvider (Supabase or Shopify) that returns the same shapes.

export type CategorySlug = "new-in" | "lawn" | "unstitched" | "ready-to-wear" | "dupattas" | "sale";

export type Category = {
  slug: CategorySlug;
  name: string;
  description: string;
  /** Placeholder tone used until real photography is added. */
  tone: string;
};

export type Product = {
  slug: string;
  sku: string;
  name: string;
  type: string;
  fabric: "Lawn" | "Cambric" | "Chiffon" | "Khaddar" | "Linen";
  categories: CategorySlug[];
  price: number;
  /** Original price when the product is on sale. */
  compareAtPrice?: number;
  colours: { name: string; hex: string }[];
  /** Ready-to-wear and stitched pieces have sizes; unstitched fabric does not. */
  sizes?: string[];
  description: string;
  details: string[];
  tone: string;
  /** Lower numbers are newer. */
  newness: number;
  stock: number;
};

export const categories: Category[] = [
  { slug: "new-in", name: "New In", description: "The latest arrivals across every collection.", tone: "#E4DDCD" },
  { slug: "lawn", name: "Lawn", description: "Light, breathable printed and embroidered lawn.", tone: "#E4DDCD" },
  { slug: "unstitched", name: "Unstitched", description: "Fabric sets to tailor exactly the way you like.", tone: "#D9DFD6" },
  { slug: "ready-to-wear", name: "Ready to Wear", description: "Stitched pieces, ready the day they arrive.", tone: "#E8DCD4" },
  { slug: "dupattas", name: "Dupattas", description: "Printed and embroidered dupattas to finish any look.", tone: "#DCDAD0" },
  { slug: "sale", name: "Sale", description: "Selected pieces at reduced prices.", tone: "#E8DCD4" },
];

export const products: Product[] = [
  {
    slug: "printed-lawn-suit-sage",
    sku: "JZ-LN-0142",
    name: "Printed Lawn Suit, Sage",
    type: "3-piece unstitched",
    fabric: "Lawn",
    categories: ["new-in", "lawn", "unstitched"],
    price: 4950,
    colours: [
      { name: "Sage", hex: "#9DAE97" },
      { name: "Rust", hex: "#A85A3C" },
      { name: "Ivory", hex: "#EDE6D6" },
    ],
    description: "A soft printed lawn suit in a calm sage tone, made for warm days and easy everyday wear.",
    details: ["Shirt: printed lawn, 3 m", "Dupatta: printed chiffon, 2.5 m", "Trouser: dyed cambric, 2.5 m"],
    tone: "#D9DFD6",
    newness: 1,
    stock: 34,
  },
  {
    slug: "embroidered-kurta-ivory",
    sku: "JZ-RW-0088",
    name: "Embroidered Kurta, Ivory",
    type: "Ready to wear",
    fabric: "Lawn",
    categories: ["new-in", "ready-to-wear", "lawn"],
    price: 6500,
    colours: [{ name: "Ivory", hex: "#EDE6D6" }],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "A relaxed ivory kurta with tonal embroidery at the neckline and sleeves.",
    details: ["Fabric: lawn", "Embroidered neckline and sleeves", "Relaxed straight fit"],
    tone: "#EAE4D7",
    newness: 2,
    stock: 12,
  },
  {
    slug: "chikankari-lawn-suit-blush",
    sku: "JZ-LN-0151",
    name: "Chikankari Lawn Suit, Blush",
    type: "3-piece unstitched",
    fabric: "Lawn",
    categories: ["new-in", "lawn", "unstitched"],
    price: 7250,
    colours: [
      { name: "Blush", hex: "#E3C4BC" },
      { name: "Sage", hex: "#9DAE97" },
    ],
    description: "Delicate chikankari embroidery on soft blush lawn, finished with a printed chiffon dupatta.",
    details: ["Shirt: chikankari lawn, 3 m", "Dupatta: printed chiffon, 2.5 m", "Trouser: dyed cambric, 2.5 m"],
    tone: "#E4DDCD",
    newness: 3,
    stock: 21,
  },
  {
    slug: "printed-chiffon-dupatta-olive",
    sku: "JZ-DP-0034",
    name: "Printed Chiffon Dupatta, Olive",
    type: "Dupatta",
    fabric: "Chiffon",
    categories: ["new-in", "dupattas"],
    price: 1850,
    colours: [{ name: "Olive", hex: "#7D8253" }],
    description: "A light printed chiffon dupatta that pairs with plain kurtas and suits.",
    details: ["Fabric: chiffon", "Length: 2.5 m"],
    tone: "#DCDAD0",
    newness: 4,
    stock: 4,
  },
  {
    slug: "cambric-shirt-trouser-rust",
    sku: "JZ-CB-0067",
    name: "Cambric Shirt & Trouser, Rust",
    type: "2-piece unstitched",
    fabric: "Cambric",
    categories: ["unstitched", "sale"],
    price: 3450,
    compareAtPrice: 4600,
    colours: [{ name: "Rust", hex: "#A85A3C" }],
    description: "A warm rust cambric two-piece for cooler days.",
    details: ["Shirt: printed cambric, 3 m", "Trouser: dyed cambric, 2.5 m"],
    tone: "#E8DCD4",
    newness: 5,
    stock: 3,
  },
  {
    slug: "linen-co-ord-set-sand",
    sku: "JZ-RW-0091",
    name: "Linen Co-ord Set, Sand",
    type: "Ready to wear",
    fabric: "Linen",
    categories: ["ready-to-wear"],
    price: 5900,
    colours: [{ name: "Sand", hex: "#D8C8A8" }],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "A breathable linen shirt and trouser set in a soft sand tone.",
    details: ["Fabric: linen", "Shirt and trouser", "Relaxed fit"],
    tone: "#E6DFD0",
    newness: 6,
    stock: 15,
  },
  {
    slug: "khaddar-suit-charcoal",
    sku: "JZ-KH-0023",
    name: "Khaddar Suit, Charcoal",
    type: "3-piece unstitched",
    fabric: "Khaddar",
    categories: ["unstitched", "sale"],
    price: 4200,
    compareAtPrice: 5600,
    colours: [{ name: "Charcoal", hex: "#3E3D3A" }],
    description: "A warm khaddar suit in deep charcoal for winter.",
    details: ["Shirt: khaddar, 3 m", "Dupatta: khaddar, 2.5 m", "Trouser: khaddar, 2.5 m"],
    tone: "#D6D3CC",
    newness: 7,
    stock: 9,
  },
  {
    slug: "printed-lawn-kurta-indigo",
    sku: "JZ-RW-0079",
    name: "Printed Lawn Kurta, Indigo",
    type: "Ready to wear",
    fabric: "Lawn",
    categories: ["ready-to-wear", "lawn", "sale"],
    price: 2950,
    compareAtPrice: 3900,
    colours: [{ name: "Indigo", hex: "#3F4E7A" }],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "An easy printed lawn kurta in indigo for everyday wear.",
    details: ["Fabric: lawn", "Straight fit", "Side slits"],
    tone: "#D5DAE0",
    newness: 8,
    stock: 18,
  },
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getProductsInCategory(slug: CategorySlug): Product[] {
  return products.filter((p) => p.categories.includes(slug)).sort((a, b) => a.newness - b.newness);
}

export function getNewArrivals(limit = 4): Product[] {
  return getProductsInCategory("new-in").slice(0, limit);
}

/** Categories shown as tiles on the home page. */
export const featuredCategories: CategorySlug[] = ["lawn", "unstitched", "ready-to-wear", "dupattas"];
