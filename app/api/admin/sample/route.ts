import { buildSampleData } from "@/lib/admin/sample-builder";
import { requireAdmin } from "@/lib/admin-auth";
import { json, readJson } from "@/lib/api";
import { databaseEnabled } from "@/lib/db/client";
import { clearSampleData, replaceSampleData } from "@/lib/db/orders";

/** Loads or clears the demo orders and requests (all marked as sample). */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!databaseEnabled()) return json({ ok: false, mode: "browser" }, 400);

  const body = (await readJson(request)) as { action?: unknown } | null;
  try {
    if (body?.action === "load") {
      const { orders, returns } = buildSampleData();
      await replaceSampleData(orders, returns);
    } else if (body?.action === "clear") {
      await clearSampleData();
    } else {
      return json({ ok: false, error: "Invalid request." }, 400);
    }
    return json({ ok: true });
  } catch (error) {
    console.error("Sample data failed", error);
    return json({ ok: false, error: "unavailable" }, 503);
  }
}
