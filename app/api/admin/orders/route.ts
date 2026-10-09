import { canCancel, moveOn, nextAction } from "@/lib/admin/status";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { CATALOG_TAG } from "@/lib/catalog-source";
import { json, readJson } from "@/lib/api";
import { databaseEnabled } from "@/lib/db/client";
import { updateOrder } from "@/lib/db/orders";
import { returnStock } from "@/lib/db/products";

/** Moves an order to its next step, or cancels it. */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!databaseEnabled()) return json({ ok: false, mode: "browser" }, 400);

  const body = (await readJson(request)) as { id?: unknown; action?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  const action = body?.action;
  if (!/^JZ-[0-9]{6}$/.test(id) || (action !== "advance" && action !== "cancel")) {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  try {
    let changed = false;
    let giveBack = false;
    const order = await updateOrder(id, (o) => {
      if (action === "advance" && nextAction(o)) {
        changed = true;
        return moveOn(o);
      }
      if (action === "cancel" && canCancel(o)) {
        changed = true;
        giveBack = o.stockTaken === true;
        return { ...o, status: "cancelled", stockTaken: false };
      }
      return null;
    });
    if (!order) return json({ ok: false, error: "Order not found." }, 404);
    // Items of a cancelled order go back on sale.
    if (giveBack) {
      await returnStock(order.lines);
      revalidateTag(CATALOG_TAG, "max");
    }
    // Not changed = someone else already moved it on; the latest copy is returned either way.
    return json({ ok: true, changed, order });
  } catch (error) {
    console.error("Admin order update failed", error);
    return json({ ok: false, error: "unavailable" }, 503);
  }
}
