import { json, readJson } from "@/lib/api";
import { mockPayFast } from "@/lib/payments/mock-payfast";

/**
 * Demo gateway only: records the shopper's choice (approve, decline, cancel) and
 * returns the signed address to send them back to the store. A real PayFast
 * integration does not have this route; PayFast itself signs the result.
 */
export async function POST(request: Request) {
  const body = (await readJson(request)) as Record<string, unknown> | null;
  if (!body) return json({ ok: false, error: "Invalid request." }, 400);

  const result = mockPayFast.completePayment({
    orderId: String(body.order ?? ""),
    amount: Number(body.amount),
    sig: typeof body.sig === "string" ? body.sig : undefined,
    outcome: String(body.outcome ?? ""),
  });
  if (!result.ok) return json({ ok: false, error: "This payment link is invalid or has been changed." }, 400);
  return json({ ok: true, returnUrl: result.returnUrl });
}
