import { revalidateTag } from "next/cache";
import { applyAdminProduct, slugify, toAdminProduct, validateAdminProduct, type AdminProduct } from "@/lib/admin/product-mapping";
import { requireAdmin } from "@/lib/admin-auth";
import { json, readJson } from "@/lib/api";
import { categories, products as builtIn } from "@/lib/catalog";
import { CATALOG_TAG } from "@/lib/catalog-source";
import { databaseEnabled } from "@/lib/db/client";
import { getProductRow, listAllProducts, upsertProduct } from "@/lib/db/products";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, 30)).filter(Boolean).slice(0, 12) : []);

/** Saves a product (edit or new). The shop pages refresh on their next visit. */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!databaseEnabled()) return json({ ok: false, mode: "browser" }, 400);

  const body = (await readJson(request)) as Record<string, unknown> | null;
  if (!body) return json({ ok: false, error: "Invalid request." }, 400);

  const isNew = body.isNew === true;
  const name = str(body.name, 80).trim();
  const input: AdminProduct = {
    slug: isNew ? slugify(name) : str(body.slug, 100),
    name,
    category: (categories.some((c) => c.slug === body.category) ? body.category : "") as AdminProduct["category"],
    price: Number(body.price),
    salePrice: body.salePrice === null || body.salePrice === "" || body.salePrice === undefined ? null : Number(body.salePrice),
    stock: Number(body.stock),
    status: body.status === "draft" ? "draft" : "active",
    colours: list(body.colours),
    sizes: list(body.sizes),
    description: str(body.description, 600),
    tone: /^#[0-9a-fA-F]{6}$/.test(str(body.tone, 7)) ? str(body.tone, 7) : "#E4DDCD",
  };

  const fieldErrors = validateAdminProduct(input);
  if (Object.keys(fieldErrors).length > 0) return json({ ok: false, error: "Please check the highlighted details.", fieldErrors }, 422);

  try {
    const existing = await getProductRow(input.slug);
    if (isNew && existing) {
      return json({ ok: false, error: "Please check the highlighted details.", fieldErrors: { name: "A product with this name already exists." } }, 422);
    }
    if (!isNew && !existing) return json({ ok: false, error: "Product not found." }, 404);

    const all = (await listAllProducts()).map((r) => r.product);
    const product = applyAdminProduct(input, existing?.product, all);
    await upsertProduct(product, input.status);
    // Shop pages show the change on their next visit (no stale copy is served).
    revalidateTag(CATALOG_TAG, { expire: 0 });
    const added = !builtIn.some((p) => p.slug === product.slug);
    return json({ ok: true, product: toAdminProduct(product, input.status, added) });
  } catch (error) {
    console.error("Saving product failed", error);
    return json({ ok: false, error: "We couldn't save the product just now. Please try again." }, 503);
  }
}
