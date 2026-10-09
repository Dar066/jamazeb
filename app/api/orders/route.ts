import { revalidateTag } from "next/cache";
import { json, readJson } from "@/lib/api";
import { CATALOG_TAG, getFreshCatalog } from "@/lib/catalog-source";
import { buildOrder, newOrderId } from "@/lib/checkout";
import { databaseEnabled } from "@/lib/db/client";
import { insertOrder } from "@/lib/db/orders";
import { OutOfStock } from "@/lib/db/products";
import type { CheckoutResponse, Order } from "@/lib/orders";
import { mockPayFast } from "@/lib/payments/mock-payfast";

/**
 * Places an order. Cash on delivery orders are confirmed straight away; online
 * payments return the payment page address. With a database configured the
 * order is saved there (and appears in the admin); in demo mode it is kept in
 * the shopper's browser only.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === null) return json({ ok: false, error: "Invalid request." } satisfies CheckoutResponse, 400);

  // Prices and stock exactly as they are now (database), never the browser's copy.
  const result = buildOrder(body, await getFreshCatalog());
  if (!result.ok) return json(result satisfies CheckoutResponse, 422);

  let order: Order = result.order;
  if (databaseEnabled()) {
    // Cash on delivery takes stock now; online payments take it once paid.
    const reserve = order.payment === "cod";
    order = { ...order, stockTaken: reserve };
    try {
      // Order numbers are random; on the rare clash, pick another.
      let saved = await insertOrder(order, reserve);
      for (let i = 0; !saved && i < 4; i++) {
        order = { ...order, id: newOrderId() };
        saved = await insertOrder(order, reserve);
      }
      if (!saved) throw new Error("Could not assign an order number");
      if (reserve) revalidateTag(CATALOG_TAG, "max");
    } catch (error) {
      if (error instanceof OutOfStock) {
        const name = order.lines.find((l) => l.slug === error.slug)?.name ?? "An item";
        const message =
          error.available > 0
            ? `Only ${error.available} of ${name} left. Please lower the quantity in your cart.`
            : `${name} has just sold out. Please remove it from your cart.`;
        return json({ ok: false, error: message } satisfies CheckoutResponse, 409);
      }
      console.error("Saving order failed", error);
      return json({ ok: false, error: "We couldn't save your order just now. Please try again in a minute." } satisfies CheckoutResponse, 503);
    }
  }

  const response: CheckoutResponse =
    order.payment === "payfast"
      ? { ok: true, order, redirectUrl: mockPayFast.createPayment({ orderId: order.id, amount: order.total }).redirectUrl }
      : { ok: true, order };
  return json(response, 201);
}
