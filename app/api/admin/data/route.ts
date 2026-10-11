import { requireAdmin } from "@/lib/admin-auth";
import { json } from "@/lib/api";
import { databaseEnabled } from "@/lib/db/client";
import { toAdminProduct } from "@/lib/admin/product-mapping";
import { products as builtIn, type Product } from "@/lib/catalog";
import { getCatalog, getFreshCatalog } from "@/lib/catalog-source";
import { listOrders, listReturns } from "@/lib/db/orders";
import { listAllProducts } from "@/lib/db/products";
import { shopifyEnabled } from "@/lib/shopify/config";

/**
 * Everything the admin dashboard shows: all orders, return requests and products (drafts included).
 * With Shopify, products are managed there and the admin lists them read-only.
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!databaseEnabled()) return json({ ok: false, mode: "browser" });
  try {
    const orders = await listOrders();
    const returns = await listReturns();
    const products = shopifyEnabled()
      ? (await shopifyProducts()).map((p) => toAdminProduct(p))
      : (await listAllProducts()).map(({ product, status }) =>
          toAdminProduct(product, status, !builtIn.some((p) => p.slug === product.slug)),
        );
    return json({ ok: true, orders, returns, products });
  } catch (error) {
    console.error("Admin data failed", error);
    return json({ ok: false, error: "unavailable" }, 503);
  }
}

/** Shopify's products as they are now; if Shopify can't be reached, the shop's last copy. */
async function shopifyProducts(): Promise<Product[]> {
  try {
    return await getFreshCatalog();
  } catch (error) {
    console.error("Reading Shopify products failed; showing the shop's last copy", error);
    return getCatalog().catch(() => []);
  }
}
