import { requireAdmin } from "@/lib/admin-auth";
import { json, readJson } from "@/lib/api";
import { databaseEnabled } from "@/lib/db/client";
import { getReturn, setReturnStatus } from "@/lib/db/orders";

/** Approves or rejects an exchange/refund request that is still waiting. */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!databaseEnabled()) return json({ ok: false, mode: "browser" }, 400);

  const body = (await readJson(request)) as { id?: unknown; status?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  const status = body?.status;
  if (!/^RT-[0-9]{6}$/.test(id) || (status !== "approved" && status !== "rejected")) {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  try {
    const current = await getReturn(id);
    if (!current) return json({ ok: false, error: "Request not found." }, 404);
    if (current.status !== "received") return json({ ok: true, changed: false, request: current });
    const updated = await setReturnStatus(id, status);
    return json({ ok: true, changed: true, request: updated });
  } catch (error) {
    console.error("Admin return update failed", error);
    return json({ ok: false, error: "unavailable" }, 503);
  }
}
