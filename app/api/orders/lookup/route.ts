import { json, readJson } from "@/lib/api";
import { databaseEnabled } from "@/lib/db/client";
import { cleanPair, slowDown } from "@/lib/db/lookup";
import { findOrder, returnsForOrders } from "@/lib/db/orders";

/** Finds one order by order number + mobile number (track page, exchange form). */
export async function POST(request: Request) {
  if (!databaseEnabled()) return json({ ok: false, mode: "browser" });
  const pair = cleanPair(await readJson(request));
  if (!pair) return json({ ok: false, error: "Enter a valid order number and mobile number." }, 400);
  try {
    const order = await findOrder(pair.id, pair.phone);
    if (!order) {
      await slowDown();
      return json({ ok: false, error: "not-found" }, 404);
    }
    return json({ ok: true, order, returns: await returnsForOrders([order.id]) });
  } catch (error) {
    console.error("Order lookup failed", error);
    return json({ ok: false, error: "unavailable" }, 503);
  }
}
