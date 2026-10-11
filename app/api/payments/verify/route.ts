import { revalidateTag } from "next/cache";
import { json, readJson } from "@/lib/api";
import { CATALOG_TAG } from "@/lib/catalog-source";
import { databaseEnabled } from "@/lib/db/client";
import { updateOrder } from "@/lib/db/orders";
import { applyPaymentResult } from "@/lib/db/payment-status";
import type { Order } from "@/lib/orders";
import { mockPayFast } from "@/lib/payments/mock-payfast";
import { stockMode, takeStockAnyway } from "@/lib/stock";

/**
 * Checks the signed payment result before the store shows an order as paid.
 * With a database, the order's status is updated there too, so the admin sees
 * the payment even if the shopper closes the page.
 */
export async function POST(request: Request) {
  const body = (await readJson(request)) as Record<string, unknown> | null;
  if (!body) return json({ valid: false }, 400);

  const params: Record<string, string | undefined> = {};
  for (const key of ["order", "amount", "outcome", "sig"]) {
    params[key] = typeof body[key] === "string" ? (body[key] as string) : undefined;
  }
  const result = mockPayFast.verifyResult(params);
  if (!result.valid) return json(result, 400);

  let order: Order | null = null;
  if (databaseEnabled()) {
    const mode = stockMode();
    try {
      let newlyPaid = false;
      order = await updateOrder(result.orderId, (o) => {
        const next = applyPaymentResult(o, result.amount, result.outcome);
        if (next?.status === "paid" && !o.stockTaken && mode !== "off") {
          newlyPaid = true;
          return { ...next, stockTaken: true, stockFrom: mode };
        }
        return next;
      });
      // The money is taken, so stock goes down even if it was short (never below zero).
      if (newlyPaid && order) {
        try {
          await takeStockAnyway(order);
          revalidateTag(CATALOG_TAG, "max");
        } catch (error) {
          // The payment still counts. Mark the stock as not taken, so a cancel won't add it back.
          console.error(`Taking stock for paid order ${order.id} failed; please adjust it by hand`, error);
          order = await updateOrder(order.id, (o) => ({ ...o, stockTaken: false, stockFrom: undefined }));
        }
      }
    } catch (error) {
      console.error("Recording payment failed", error);
      return json({ ...result, valid: false, error: "unavailable" }, 503);
    }
    // A valid signature for an order the database doesn't hold, or a different amount, is not accepted.
    if (!order || order.total !== result.amount) return json({ ...result, valid: false }, 400);
  }
  return json({ ...result, order });
}
