import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { json } from "@/lib/api";
import { CATALOG_TAG } from "@/lib/catalog-source";
import { shopifyEnabled } from "@/lib/shopify/config";

const MAX_BODY = 1_000_000;

/**
 * Shopify calls this when products or stock change (webhooks for product
 * creation, update and deletion, and inventory level updates), so the shop
 * pages show the change on their next visit instead of within the hour.
 * Every call is checked against SHOPIFY_WEBHOOK_SECRET; nothing else is trusted.
 */
export async function POST(request: Request) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret || !shopifyEnabled()) return json({ ok: false }, 404);

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) return json({ ok: false }, 413);
  const body = Buffer.from(await request.arrayBuffer());
  if (body.length > MAX_BODY) return json({ ok: false }, 413);

  // Shopify signs the exact request body: HMAC-SHA256 with the secret, in base64.
  const given = Buffer.from(request.headers.get("x-shopify-hmac-sha256") ?? "", "base64");
  const expected = createHmac("sha256", secret).update(body).digest();
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return json({ ok: false }, 401);

  revalidateTag(CATALOG_TAG, { expire: 0 });
  return json({ ok: true });
}
