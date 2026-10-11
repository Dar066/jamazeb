import { revalidateTag } from "next/cache";
import { json, readJson } from "@/lib/api";
import { CATALOG_TAG, getFreshCatalog } from "@/lib/catalog-source";
import { buildOrder, newOrderId } from "@/lib/checkout";
import { databaseEnabled } from "@/lib/db/client";
import { insertOrder } from "@/lib/db/orders";
import { OutOfStock } from "@/lib/db/products";
import type { CheckoutResponse, Order } from "@/lib/orders";
import { mockPayFast } from "@/lib/payments/mock-payfast";
import { returnStock, stockMode, takeShopifyStock } from "@/lib/stock";

const unavailable = { ok: false, error: "We couldn't save your order just now. Please try again in a minute." } satisfies CheckoutResponse;

/**
 * Places an order. Cash on delivery orders are confirmed straight away; online
 * payments return the payment page address. With a database configured the
 * order is saved there (and appears in the admin); in demo mode it is kept in
 * the shopper's browser only.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === null) return json({ ok: false, error: "Invalid request." } satisfies CheckoutResponse, 400);

  // Prices and stock exactly as they are now (database or Shopify), never the browser's copy.
  let catalog;
  try {
    catalog = await getFreshCatalog();
  } catch (error) {
    console.error("Reading products failed", error);
    return json(unavailable, 503);
  }
  const result = buildOrder(body, catalog);
  if (!result.ok) return json(result satisfies CheckoutResponse, 422);

  let order: Order = result.order;
  if (databaseEnabled()) {
    // Cash on delivery takes stock now; online payments take it once paid.
    const mode = stockMode();
    const reserve = order.payment === "cod" && mode !== "off";
    order = { ...order, stockTaken: reserve, ...(reserve ? { stockFrom: mode as "database" | "shopify" } : {}) };
    let takenInShopify = false;
    try {
      // Shopify stock is taken first; database stock in the same transaction as the order.
      if (reserve && mode === "shopify") {
        await takeShopifyStock(order);
        takenInShopify = true;
      }
      // Order numbers are random; on the rare clash, pick another.
      let saved = await insertOrder(order, reserve && mode === "database");
      for (let i = 0; !saved && i < 4; i++) {
        order = { ...order, id: newOrderId() };
        saved = await insertOrder(order, reserve && mode === "database");
      }
      if (!saved) throw new Error("Could not assign an order number");
      if (reserve) revalidateTag(CATALOG_TAG, "max");
    } catch (error) {
      // The order wasn't saved: give back what was taken in Shopify.
      if (takenInShopify) {
        await returnStock(order).catch((e) => console.error("Giving back Shopify stock failed", e));
      }
      if (error instanceof OutOfStock) {
        const product = order.lines.find((l) => l.slug === error.slug)?.name ?? "An item";
        const name = error.variant ? `${product} (${error.variant})` : product;
        const message =
          error.available > 0
            ? `Only ${error.available} of ${name} left. Please lower the quantity in your cart.`
            : `${name} has just sold out. Please remove it from your cart.`;
        return json({ ok: false, error: message } satisfies CheckoutResponse, 409);
      }
      console.error("Saving order failed", error);
      return json(unavailable, 503);
    }
  }

  const response: CheckoutResponse =
    order.payment === "payfast"
      ? { ok: true, order, redirectUrl: mockPayFast.createPayment({ orderId: order.id, amount: order.total }).redirectUrl }
      : { ok: true, order };
  return json(response, 201);
}
