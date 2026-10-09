import { randomInt } from "node:crypto";
import { json, readJson } from "@/lib/api";
import { getProduct } from "@/lib/catalog";
import { MAX_LINES, MAX_QTY } from "@/lib/orders";
import { RETURN_LIMITS, needsRefundAccount, validateReturn, type ReturnInput, type ReturnRequest } from "@/lib/returns";
import { normalizePkMobile } from "@/lib/validation";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/**
 * Receives an exchange or refund request. The demo checks the request itself;
 * once orders are in the database (Phase 6) it also checks the order, mobile
 * number and 5-day window on the server before accepting.
 */
export async function POST(request: Request) {
  const body = (await readJson(request)) as Record<string, unknown> | null;
  if (!body) return json({ ok: false, error: "Invalid request." }, 400);

  const orderId = str(body.orderId, 20);
  const phone = normalizePkMobile(str(body.phone, 30));
  if (!/^JZ-[0-9]{6}$/.test(orderId) || !phone) return json({ ok: false, error: "Order not recognised." }, 422);

  const rawItems = Array.isArray(body.items) ? body.items.slice(0, MAX_LINES) : [];
  const items: ReturnInput["items"] = [];
  for (const raw of rawItems) {
    const item = (raw ?? {}) as Record<string, unknown>;
    const product = getProduct(str(item.slug, 100));
    const qty = Number(item.qty);
    if (!product || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
      return json({ ok: false, error: "An item in this request isn't recognised." }, 422);
    }
    items.push({ slug: product.slug, name: product.name, variant: str(item.variant, 120), qty });
  }

  const input: ReturnInput = {
    orderId,
    phone,
    payment: body.payment === "payfast" ? "payfast" : "cod",
    items,
    kind: body.kind === "refund" ? "refund" : "exchange",
    exchangeFor: str(body.exchangeFor, RETURN_LIMITS.exchangeFor + 1).trim(),
    reason: str(body.reason, 60),
    details: str(body.details, RETURN_LIMITS.details + 1).trim(),
    refundMethod: str(body.refundMethod, 30),
    accountTitle: str(body.accountTitle, RETURN_LIMITS.accountTitle + 1).trim(),
    accountNumber: str(body.accountNumber, RETURN_LIMITS.accountNumber + 10).trim(),
    agreed: body.agreed === true,
  };

  const fieldErrors = validateReturn(input);
  if (Object.keys(fieldErrors).length > 0) {
    return json({ ok: false, error: "Please check the highlighted details.", fieldErrors }, 422);
  }

  // Keep only what the chosen option needs.
  const keepAccount = needsRefundAccount(input);
  const saved: ReturnRequest = {
    id: `RT-${randomInt(100000, 1000000)}`,
    createdAt: new Date().toISOString(),
    status: "received",
    orderId: input.orderId,
    phone: input.phone,
    payment: input.payment,
    items: input.items,
    kind: input.kind,
    exchangeFor: input.kind === "exchange" ? input.exchangeFor : "",
    reason: input.reason,
    details: input.details,
    refundMethod: keepAccount ? input.refundMethod : "",
    accountTitle: keepAccount ? input.accountTitle : "",
    accountNumber: keepAccount ? input.accountNumber : "",
  };
  return json({ ok: true, request: saved }, 201);
}
