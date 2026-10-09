// Exchange and refund requests: shapes and rules shared by the form (instant
// feedback) and POST /api/returns (the rules that decide).

import type { PaymentMethod } from "./orders";

export const RETURN_REASONS = [
  "Size or fit is not right",
  "Colour looks different",
  "Damaged or faulty item",
  "Wrong item received",
  "Changed my mind",
] as const;

export type ReturnReason = (typeof RETURN_REASONS)[number];
export type ReturnKind = "exchange" | "refund";

export const REFUND_METHODS = ["Easypaisa", "JazzCash", "Bank account"] as const;
export type RefundMethod = (typeof REFUND_METHODS)[number];

export const RETURN_LIMITS = { exchangeFor: 120, details: 500, accountTitle: 80, accountNumber: 34 } as const;

/** One item being sent back, as shown on the order. */
export type ReturnItem = { slug: string; name: string; variant: string; qty: number };

export type ReturnInput = {
  orderId: string;
  phone: string;
  payment: PaymentMethod;
  items: ReturnItem[];
  kind: ReturnKind;
  /** Exchange only: what the customer wants instead. */
  exchangeFor: string;
  reason: string;
  details: string;
  /** Refund of a cash-on-delivery order only: where to send the money. */
  refundMethod: string;
  accountTitle: string;
  accountNumber: string;
  agreed: boolean;
};

export type ReturnErrors = Partial<Record<"items" | "exchangeFor" | "reason" | "details" | "refundMethod" | "accountTitle" | "accountNumber" | "agreed", string>>;

export type ReturnStatus = "received" | "approved" | "rejected";

export type ReturnRequest = Omit<ReturnInput, "agreed"> & {
  id: string;
  createdAt: string;
  status: ReturnStatus;
  /** Set by the store when approving or rejecting. */
  decidedAt?: string;
  /** Demo data added from the admin dashboard. */
  sample?: boolean;
};

/** What the customer sees for each request status. */
export const returnStatusLabels: Record<ReturnStatus, string> = {
  received: "Received, we'll confirm on WhatsApp",
  approved: "Approved, our courier will collect the item",
  rejected: "Not accepted, we'll explain on WhatsApp",
};

/** Cash-on-delivery refunds need somewhere to send the money; online payments go back to the card or wallet. */
export function needsRefundAccount(input: Pick<ReturnInput, "kind" | "payment">): boolean {
  return input.kind === "refund" && input.payment === "cod";
}

export function validateReturn(input: ReturnInput): ReturnErrors {
  const errors: ReturnErrors = {};
  if (input.items.length === 0) errors.items = "Choose at least one item.";
  if (input.kind === "exchange") {
    if (input.exchangeFor.trim().length < 2) errors.exchangeFor = "Tell us the size or colour you'd like instead.";
    if (input.exchangeFor.length > RETURN_LIMITS.exchangeFor) errors.exchangeFor = "Please keep this shorter.";
  }
  if (!(RETURN_REASONS as readonly string[]).includes(input.reason)) errors.reason = "Choose a reason.";
  if (input.details.length > RETURN_LIMITS.details) errors.details = "Please keep the details under 500 characters.";
  if (needsRefundAccount(input)) {
    if (!(REFUND_METHODS as readonly string[]).includes(input.refundMethod)) errors.refundMethod = "Choose where to receive your refund.";
    if (input.accountTitle.trim().length < 3) errors.accountTitle = "Enter the account holder's name.";
    if (input.accountTitle.length > RETURN_LIMITS.accountTitle) errors.accountTitle = "Name is too long.";
    const digits = input.accountNumber.replace(/[\s-]/g, "");
    const valid =
      input.refundMethod === "Bank account"
        ? /^(PK[0-9]{2}[A-Z]{4}[0-9]{16}|[0-9]{8,20})$/i.test(digits)
        : /^03[0-9]{9}$/.test(digits);
    if (!valid) {
      errors.accountNumber =
        input.refundMethod === "Bank account"
          ? "Enter your IBAN (PK…) or account number."
          : "Enter the mobile account number, like 0300 1234567.";
    }
  }
  if (!input.agreed) errors.agreed = "Please confirm the items are unused with tags attached.";
  return errors;
}
