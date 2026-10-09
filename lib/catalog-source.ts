// Where the shop's products come from: the database when it is connected,
// otherwise the built-in catalogue (demo mode). Server only.

import { cacheLife, cacheTag } from "next/cache";
import { products as builtIn, type Product } from "./catalog";
import { databaseEnabled } from "./db/client";
import { listActiveProducts } from "./db/products";

export const CATALOG_TAG = "catalog";

/**
 * The product list the shop pages are built from. Cached so pages stay static
 * and fast; refreshed in the background every hour, and straight away when the
 * admin saves a product (see revalidateTag in the admin products API).
 */
export async function getCatalog(): Promise<Product[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  return readCatalog();
}

/** Uncached read, for checkout: prices and stock exactly as they are now. */
export async function getFreshCatalog(): Promise<Product[]> {
  return readCatalog();
}

async function readCatalog(): Promise<Product[]> {
  if (!databaseEnabled()) return builtIn;
  try {
    return await listActiveProducts();
  } catch (error) {
    // Keep the shop open with the built-in catalogue if the database is unreachable.
    console.error("Reading products failed; using the built-in catalogue", error);
    return builtIn;
  }
}
