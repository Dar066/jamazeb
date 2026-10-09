import { randomInt } from "node:crypto";
import { json, readJson } from "@/lib/api";
import { describeVariant } from "@/lib/cart-pricing";
import { getProduct } from "@/lib/catalog";
import { getFreshCatalog } from "@/lib/catalog-source";
import { databaseEnabled } from "@/lib/db/client";
import { findOrder, insertReturn } from "@/lib/db/orders";
import { returnEligibility } from "@/lib/fulfilment";
import { MAX_LINES, MAX_QTY } from "@/lib/orders";
import { RETURN_LIMITS, needsRefundAccount, validateReturn, type ReturnInput, type ReturnRequest } from "@/lib/returns";
import { normalizePkMobile } from "@/lib/validation";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/**
 * Receives an exchange or refund request. The request itself is always checked.
 * With a database, the server also checks the order and mobile number, the
 * 5-day window and that each item really is in that order, then saves it.
 */
export async function POST(request: Request) {
  const body = (await readJson(request)) as Record<string, unknown> | null;
  if (!body) return json({ ok: false, error: "Invalid request." }, 400);

  const orderId = str(body.orderId, 20);
  const phone = normalizePkMobile(str(body.phone, 30));
  if (!/^JZ-[0-9]{6}$/.test(orderId) || !phone) return json({ ok: false, error: "Order not recognised." }, 422);

  const rawItems = Array.isArray(body.items) ? body.items.slice(0, MAX_LINES) : [];
  const catalog = await getFreshCatalog();
  const items: ReturnInput["items"] = [];
  for (const raw of rawItems) {
    const item = (raw ?? {}) as Record<string, unknown>;
    const slug = str(item.slug, 100);
    const product = getProduct(slug, catalog);
    const qty = Number(item.qty);
    // With a database, items are checked against the stored order below (products may have changed since).
    if ((!product && !databaseEnabled()) || !/^[a-z0-9-]{1,100}$/.test(slug) || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
      return json({ ok: false, error: "An item in this request isn't recognised." }, 422);
    }
    items.push({ slug, name: product?.name ?? str(item.name, 100), variant: str(item.variant, 120), qty });
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

  if (databaseEnabled()) {
    try {
      const order = await findOrder(orderId, phone);
      if (!order) return json({ ok: false, error: "We couldn't find that order with this mobile number." }, 404);
      const eligibility = returnEligibility(order);
      if (!eligibility.eligible) {
        const reason =
          eligibility.reason === "expired"
            ? "This order is past the exchange and refund window."
            : "This order can't be exchanged or refunded yet.";
        return json({ ok: false, error: reason }, 422);
      }
      for (const item of input.items) {
        const line = order.lines.find((l) => l.slug === item.slug && describeVariant(l) === item.variant);
        if (!line || item.qty > line.qty) return json({ ok: false, error: "An item in this request isn't in that order." }, 422);
        item.name = line.name;
      }
      // The payment method comes from the order, never from the request; check again with it.
      input.payment = order.payment;
      const recheck = validateReturn(input);
      if (Object.keys(recheck).length > 0) {
        return json({ ok: false, error: "Please check the highlighted details.", fieldErrors: recheck }, 422);
      }
    } catch (error) {
      console.error("Return check failed", error);
      return json({ ok: false, error: "We couldn't check your order just now. Please try again in a minute." }, 503);
    }
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
  if (databaseEnabled()) {
    try {
      let stored = await insertReturn(saved);
      for (let i = 0; !stored && i < 4; i++) {
        saved.id = `RT-${randomInt(100000, 1000000)}`;
        stored = await insertReturn(saved);
      }
      if (!stored) throw new Error("Could not assign a request number");
    } catch (error) {
      console.error("Saving return failed", error);
      return json({ ok: false, error: "We couldn't save your request just now. Please try again in a minute." }, 503);
    }
  }
  return json({ ok: true, request: saved }, 201);
}
