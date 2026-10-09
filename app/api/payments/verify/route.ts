import { revalidateTag } from "next/cache";
import { json, readJson } from "@/lib/api";
import { CATALOG_TAG } from "@/lib/catalog-source";
import { databaseEnabled } from "@/lib/db/client";
import { updateOrder } from "@/lib/db/orders";
import { applyPaymentResult } from "@/lib/db/payment-status";
import { takeStockAnyway } from "@/lib/db/products";
import type { Order } from "@/lib/orders";
import { mockPayFast } from "@/lib/payments/mock-payfast";

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
    try {
      let newlyPaid = false;
      order = await updateOrder(result.orderId, (o) => {
        const next = applyPaymentResult(o, result.amount, result.outcome);
        if (next?.status === "paid" && !o.stockTaken) {
          newlyPaid = true;
          return { ...next, stockTaken: true };
        }
        return next;
      });
      // The money is taken, so stock goes down even if it was short (never below zero).
      if (newlyPaid && order) {
        await takeStockAnyway(order.lines);
        revalidateTag(CATALOG_TAG, "max");
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
