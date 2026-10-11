// Where stock is kept when orders are saved in the database:
// - "database": the jamazeb.products table (Phase 6B);
// - "shopify":  Shopify, changed through the Admin API (Phase 6C);
// - "off":      products come from Shopify but no Admin API login is set, so
//               stock is only checked here and changed by the store in Shopify.
// Each order remembers where its stock was taken from, so a cancel returns it there.

import { returnStock as returnDbStock, takeStockAnyway as takeDbStockAnyway } from "./db/products";
import type { Order } from "./orders";
import { shopifyEnabled, stockSyncEnabled } from "./shopify/config";
import { changeShopifyStock } from "./shopify/stock";

export type StockMode = "database" | "shopify" | "off";

export function stockMode(): StockMode {
  if (!shopifyEnabled()) return "database";
  return stockSyncEnabled() ? "shopify" : "off";
}

/** Shopify only: takes stock before a cash-on-delivery order is saved (throws OutOfStock). */
export function takeShopifyStock(order: Order): Promise<void> {
  return changeShopifyStock(order.id, order.lines, "take");
}

/** A paid order: takes its stock from where `stockFrom` says, down to zero at most. */
export async function takeStockAnyway(order: Order): Promise<void> {
  if (order.stockFrom === "shopify") await changeShopifyStock(order.id, order.lines, "take-anyway");
  else await takeDbStockAnyway(order.lines);
}

/** A cancelled order: puts its stock back where it was taken from. */
export async function returnStock(order: Order): Promise<void> {
  if ((order.stockFrom ?? "database") === "shopify") await changeShopifyStock(order.id, order.lines, "give-back");
  else await returnDbStock(order.lines);
}
