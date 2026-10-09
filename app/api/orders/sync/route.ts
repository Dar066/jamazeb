import { json, readJson } from "@/lib/api";
import { databaseEnabled } from "@/lib/db/client";
import { cleanPair } from "@/lib/db/lookup";
import { findOrders, returnsForOrders } from "@/lib/db/orders";

/** Latest status of the orders saved on this device (account page), each matched by its mobile number. */
export async function POST(request: Request) {
  if (!databaseEnabled()) return json({ ok: false, mode: "browser" });
  const body = (await readJson(request)) as { orders?: unknown } | null;
  const pairs = (Array.isArray(body?.orders) ? body.orders.slice(0, 50) : [])
    .map(cleanPair)
    .filter((p): p is { id: string; phone: string } => p !== null);
  try {
    const orders = await findOrders(pairs);
    return json({ ok: true, orders, returns: await returnsForOrders(orders.map((o) => o.id)) });
  } catch (error) {
    console.error("Order sync failed", error);
    return json({ ok: false, error: "unavailable" }, 503);
  }
}
