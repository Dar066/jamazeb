import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentOutcome, PaymentProvider, PaymentResult } from "./types";

// Signing key. Set MOCK_PAYMENT_SECRET in Vercel; the fallback keeps the demo working.
const SECRET = process.env.MOCK_PAYMENT_SECRET || "jamazeb-demo-payment-secret";

const OUTCOMES: PaymentOutcome[] = ["paid", "failed", "cancelled"];

export function sign(...parts: (string | number)[]): string {
  return createHmac("sha256", SECRET).update(parts.join("|")).digest("hex");
}

/** Constant-time comparison so signatures can't be guessed byte by byte. */
export function signatureMatches(expected: string, given: string | undefined): boolean {
  if (!given || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(given));
}

/**
 * Mock of PayFast Pakistan's hosted checkout:
 * 1. createPayment signs the order id and amount and sends the shopper to /pay/mock.
 * 2. The gateway (completePayment) checks that signature, then returns a newly signed result.
 * 3. verifyResult checks the result signature before the order is marked paid.
 */
class MockPayFast implements PaymentProvider {
  readonly name = "PayFast (demo)";

  createPayment({ orderId, amount }: { orderId: string; amount: number }) {
    const params = new URLSearchParams({ order: orderId, amount: String(amount), sig: sign("pay", orderId, amount) });
    return { redirectUrl: `/pay/mock?${params}` };
  }

  /** Used only by the demo gateway page. Rejects requests whose order or amount was altered. */
  completePayment(input: { orderId: string; amount: number; sig?: string; outcome: string }) {
    const { orderId, amount, sig, outcome } = input;
    if (!signatureMatches(sign("pay", orderId, amount), sig)) return { ok: false as const };
    if (!OUTCOMES.includes(outcome as PaymentOutcome)) return { ok: false as const };
    const params = new URLSearchParams({
      order: orderId,
      amount: String(amount),
      outcome,
      sig: sign("result", orderId, amount, outcome),
    });
    return { ok: true as const, returnUrl: `/checkout/complete?${params}` };
  }

  verifyResult(params: Record<string, string | undefined>): PaymentResult {
    const orderId = params.order ?? "";
    const amount = Number(params.amount);
    const outcome = (params.outcome ?? "") as PaymentOutcome;
    const valid =
      /^JZ-[0-9]{6}$/.test(orderId) &&
      Number.isInteger(amount) &&
      amount > 0 &&
      OUTCOMES.includes(outcome) &&
      signatureMatches(sign("result", orderId, amount, outcome), params.sig);
    return { valid, orderId, amount, outcome };
  }
}

export const mockPayFast = new MockPayFast();
