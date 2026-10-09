import { requireAdmin } from "@/lib/admin-auth";
import { json } from "@/lib/api";
import { databaseEnabled } from "@/lib/db/client";
import { toAdminProduct } from "@/lib/admin/product-mapping";
import { products as builtIn } from "@/lib/catalog";
import { listOrders, listReturns } from "@/lib/db/orders";
import { listAllProducts } from "@/lib/db/products";

/** Everything the admin dashboard shows: all orders, return requests and products (drafts included). */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!databaseEnabled()) return json({ ok: false, mode: "browser" });
  try {
    const orders = await listOrders();
    const returns = await listReturns();
    const products = (await listAllProducts()).map(({ product, status }) =>
      toAdminProduct(product, status, !builtIn.some((p) => p.slug === product.slug)),
    );
    return json({ ok: true, orders, returns, products });
  } catch (error) {
    console.error("Admin data failed", error);
    return json({ ok: false, error: "unavailable" }, 503);
  }
}
