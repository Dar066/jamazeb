// Builds an order on the server from what the shopper sent. Every price, stock
// level and delivery charge comes from the catalogue and shipping provider here,
// never from the browser, so an edited request can't change what is charged.

import { randomInt } from "node:crypto";
import { STITCHED_SIZES, STITCHING_PRICE, getProduct, products as builtIn, type Product } from "./catalog";
import { MAX_LINES, MAX_QTY, type CheckoutRequest, type Order, type OrderLine } from "./orders";
import { shipping } from "./shipping";
import { normalizePkMobile, validateCustomer, type CustomerInput } from "./validation";

export type BuildResult =
  | { ok: true; order: Order }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const str = (v: unknown, max = 300) => (typeof v === "string" ? v.slice(0, max) : "");

/** Order numbers look like JZ-482913. Swapped for a database sequence in Phase 6. */
export function newOrderId(): string {
  return `JZ-${randomInt(100000, 1000000)}`;
}

/** `catalog` = the products as they are right now (database or built-in). */
export function buildOrder(body: unknown, catalog: Product[] = builtIn): BuildResult {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid request." };
  const req = body as Partial<CheckoutRequest>;

  // Customer details
  const raw = (req.customer ?? {}) as Partial<Record<keyof CustomerInput, unknown>>;
  const customer: CustomerInput = {
    phone: str(raw.phone, 30),
    email: str(raw.email, 200).trim(),
    name: str(raw.name, 200).trim(),
    city: str(raw.city, 60),
    address: str(raw.address, 400).trim(),
    notes: str(raw.notes, 400).trim(),
    whatsappUpdates: raw.whatsappUpdates === true,
  };
  const fieldErrors = validateCustomer(customer, shipping.cities);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Please check the highlighted details.", fieldErrors };
  }
  customer.phone = normalizePkMobile(customer.phone)!;

  // Payment method
  if (req.payment !== "cod" && req.payment !== "payfast") return { ok: false, error: "Choose a payment method." };

  // Items
  const items = Array.isArray(req.items) ? req.items : [];
  if (items.length === 0) return { ok: false, error: "Your cart is empty." };
  if (items.length > MAX_LINES) return { ok: false, error: `An order can hold up to ${MAX_LINES} items.` };

  const lines: OrderLine[] = [];
  const qtyBySlug = new Map<string, number>();

  for (const item of items) {
    const product = getProduct(str(item?.slug, 100), catalog);
    if (!product) return { ok: false, error: "An item in your cart is no longer available. Please remove it." };

    const colour = str(item.colour, 60);
    const option = str(item.option, 20);
    const size = str(item.size, 10);
    const qty = item.qty;
    const unavailable = { ok: false as const, error: `Please re-add ${product.name} to your cart; that option isn't available.` };

    if (!product.colours.some((c) => c.name === colour)) return unavailable;

    const allowedOptions = product.stitchable ? ["Unstitched", "Stitched"] : [""];
    if (!allowedOptions.includes(option)) return unavailable;

    const stitched = option === "Stitched";
    const sizes = product.sizes ?? (stitched ? STITCHED_SIZES : undefined);
    if (sizes ? !sizes.includes(size) : size !== "") return unavailable;

    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
      return { ok: false, error: `Quantity for ${product.name} must be between 1 and ${MAX_QTY}.` };
    }

    const total = (qtyBySlug.get(product.slug) ?? 0) + qty;
    qtyBySlug.set(product.slug, total);
    if (total > product.stock) {
      return {
        ok: false,
        error: product.stock > 0 ? `Only ${product.stock} of ${product.name} left. Please lower the quantity.` : `${product.name} is sold out.`,
      };
    }

    const unitPrice = product.price + (stitched ? STITCHING_PRICE : 0);
    lines.push({ slug: product.slug, name: product.name, colour, option, size, qty, unitPrice, lineTotal: unitPrice * qty, tone: product.tone });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const delivery = shipping.getRate(customer.city);

  return {
    ok: true,
    order: {
      id: newOrderId(),
      createdAt: new Date().toISOString(),
      status: req.payment === "cod" ? "awaiting-confirmation" : "awaiting-payment",
      payment: req.payment,
      customer,
      lines,
      subtotal,
      shipping: delivery,
      total: subtotal + delivery,
      deliveryEstimate: shipping.getEstimate(customer.city),
    },
  };
}
