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
  | "payment-cancelled"
  | "cancelled"; // cancelled by the store, e.g. a cash-on-delivery order the customer didn't confirm

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
  /** Delivery progress, see lib/fulfilment.ts. Missing means just placed. */
  fulfilment?: Fulfilment;
  /** Demo data added from the admin dashboard; removed with "Clear sample data". */
  sample?: boolean;
  /** True once this order's items were taken from stock (database mode), so a cancel can return them. */
  stockTaken?: boolean;
};

export type Fulfilment = {
  /** Index into FULFILMENT_STEPS. */
  step: number;
  /** When each step was reached (ISO dates), indexed like FULFILMENT_STEPS. */
  times: string[];
  trackingNumber?: string;
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
  cancelled: "Cancelled",
};
