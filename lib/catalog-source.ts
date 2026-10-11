// Where the shop's products come from: Shopify when it is connected, otherwise
// the database when it is connected, otherwise the built-in catalogue (demo
// mode). Server only.

import { cacheLife, cacheTag } from "next/cache";
import { products as builtIn, type Product } from "./catalog";
import { databaseEnabled } from "./db/client";
import { listActiveProducts } from "./db/products";
import { shopifyEnabled } from "./shopify/config";
import { listShopifyProducts } from "./shopify/products";

export const CATALOG_TAG = "catalog";

/**
 * The product list the shop pages are built from. Cached so pages stay static
 * and fast; refreshed in the background every hour, and straight away when the
 * admin saves a product (see revalidateTag in the admin products API) or
 * Shopify reports a change (app/api/shopify/webhook).
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
  // No fallback for Shopify: showing the demo products in a real store would be wrong.
  // If Shopify can't be reached, pages keep their last copy and checkout asks to try again.
  if (shopifyEnabled()) return listShopifyProducts();
  if (!databaseEnabled()) return builtIn;
  try {
    return await listActiveProducts();
  } catch (error) {
    // Keep the shop open with the built-in catalogue if the database is unreachable.
    console.error("Reading products failed; using the built-in catalogue", error);
    return builtIn;
  }
}
