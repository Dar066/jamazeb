import { json, readJson } from "@/lib/api";
import { buildOrder } from "@/lib/checkout";
import type { CheckoutResponse } from "@/lib/orders";
import { mockPayFast } from "@/lib/payments/mock-payfast";

/**
 * Places an order. Cash on delivery orders are confirmed straight away; online
 * payments return the payment page address. In Phase 6 the order is also saved
 * to the database here; for the demo it is stored in the shopper's browser.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === null) return json({ ok: false, error: "Invalid request." } satisfies CheckoutResponse, 400);

  const result = buildOrder(body);
  if (!result.ok) return json(result satisfies CheckoutResponse, 422);

  const { order } = result;
  const response: CheckoutResponse =
    order.payment === "payfast"
      ? { ok: true, order, redirectUrl: mockPayFast.createPayment({ orderId: order.id, amount: order.total }).redirectUrl }
      : { ok: true, order };
  return json(response, 201);
}
