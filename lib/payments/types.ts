// Online payments are behind a PaymentProvider interface. The demo uses a mock
// gateway that behaves like PayFast Pakistan (redirect, then a signed result that
// the server must verify). The real PayFast adapter implements the same methods.

export type PaymentOutcome = "paid" | "failed" | "cancelled";

export type PaymentResult = {
  valid: boolean;
  orderId: string;
  amount: number;
  outcome: PaymentOutcome;
};

export interface PaymentProvider {
  readonly name: string;
  /** Returns the address to send the shopper to for payment. */
  createPayment(input: { orderId: string; amount: number }): { redirectUrl: string };
  /** Checks a payment result coming back to the store. Never trust a result that fails this. */
  verifyResult(params: Record<string, string | undefined>): PaymentResult;
}
