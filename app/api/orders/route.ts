import { json, readJson } from "@/lib/api";
import { buildOrder, newOrderId } from "@/lib/checkout";
import { databaseEnabled } from "@/lib/db/client";
import { insertOrder } from "@/lib/db/orders";
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

  const result = buildOrder(body);
  if (!result.ok) return json(result satisfies CheckoutResponse, 422);

  let order: Order = result.order;
  if (databaseEnabled()) {
    try {
      // Order numbers are random; on the rare clash, pick another.
      let saved = await insertOrder(order);
      for (let i = 0; !saved && i < 4; i++) {
        order = { ...order, id: newOrderId() };
        saved = await insertOrder(order);
      }
      if (!saved) throw new Error("Could not assign an order number");
    } catch (error) {
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
