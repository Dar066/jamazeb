import { canCancel, moveOn, nextAction } from "@/lib/admin/status";
import { requireAdmin } from "@/lib/admin-auth";
import { json, readJson } from "@/lib/api";
import { databaseEnabled } from "@/lib/db/client";
import { updateOrder } from "@/lib/db/orders";

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
    const order = await updateOrder(id, (o) => {
      if (action === "advance" && nextAction(o)) {
        changed = true;
        return moveOn(o);
      }
      if (action === "cancel" && canCancel(o)) {
        changed = true;
        return { ...o, status: "cancelled" };
      }
      return null;
    });
    if (!order) return json({ ok: false, error: "Order not found." }, 404);
    // Not changed = someone else already moved it on; the latest copy is returned either way.
    return json({ ok: true, changed, order });
  } catch (error) {
    console.error("Admin order update failed", error);
    return json({ ok: false, error: "unavailable" }, 503);
  }
}
