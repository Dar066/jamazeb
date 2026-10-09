import { requireAdmin } from "@/lib/admin-auth";
import { json } from "@/lib/api";
import { databaseEnabled } from "@/lib/db/client";
import { listOrders, listReturns } from "@/lib/db/orders";

/** Everything the admin dashboard shows: all orders and return requests. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!databaseEnabled()) return json({ ok: false, mode: "browser" });
  try {
    const [orders, returns] = await Promise.all([listOrders(), listReturns()]);
    return json({ ok: true, orders, returns });
  } catch (error) {
    console.error("Admin data failed", error);
    return json({ ok: false, error: "unavailable" }, 503);
  }
}
