// Order shapes shared by the checkout page, the API and order history.

/** Most of one item (product + variant) a shopper can order at once. */
export const MAX_QTY = 10;

/** Most separate lines one order can hold. */
export const MAX_LINES = 20;

export type PaymentMethod = "cod" | "payfast";

export type OrderStatus =
  | "awaiting-confirmation" // cash on delivery: we confirm on WhatsApp before dispatch
  | "awaiting-payment" // sent to the payment page, result not back yet
  | "paid"
  | "payment-failed"
  | "payment-cancelled";

export type OrderLine = {
  slug: string;
  name: string;
  colour: string;
  option: string;
  size: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  tone: string;
};

export type Order = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  payment: PaymentMethod;
  customer: {
    name: string;
    phone: string;
    email: string;
    city: string;
    address: string;
    notes: string;
    whatsappUpdates: boolean;
  };
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
  deliveryEstimate: string;
  /** Online payments: the payment page address, so a declined payment can be retried. */
  paymentUrl?: string;
};

/** What the checkout page sends to POST /api/orders. Prices are never sent: the server sets them. */
export type CheckoutRequest = {
  customer: Order["customer"];
  payment: PaymentMethod;
  items: { slug: string; colour: string; option: string; size: string; qty: number }[];
};

export type CheckoutResponse =
  | { ok: true; order: Order; redirectUrl?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export const statusLabels: Record<OrderStatus, string> = {
  "awaiting-confirmation": "Awaiting confirmation",
  "awaiting-payment": "Awaiting payment",
  paid: "Paid",
  "payment-failed": "Payment declined",
  "payment-cancelled": "Payment cancelled",
};
