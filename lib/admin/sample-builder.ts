// Realistic sample orders and requests so the dashboard can be shown with data.
// Everything built here is marked `sample` and removed by "Clear sample data".
// Used in the browser (demo mode) and on the server (database mode).

import { STITCHING_PRICE, getProduct } from "../catalog";
import { DELIVERED_STEP } from "../fulfilment";
import type { Order, OrderLine } from "../orders";
import type { ReturnRequest } from "../returns";
import { shipping } from "../shipping";

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

type Pick = [slug: string, colour: string, option: string, size: string, qty: number];
type Spec = {
  name: string;
  phone: string;
  city: string;
  address: string;
  payment: "cod" | "payfast";
  daysAgo: number;
  hour: number;
  step: number;
  cancelled?: boolean;
  items: Pick[];
};

const SPECS: Spec[] = [
  { name: "Sana Iqbal", phone: "03331234501", city: "Karachi", address: "Flat 4, Block 7, Gulshan-e-Iqbal", payment: "cod", daysAgo: 0, hour: 14, step: 0, items: [["chikankari-lawn-suit-blush", "Blush", "Unstitched", "", 1]] },
  { name: "Hira Malik", phone: "03211234502", city: "Lahore", address: "House 22, Street 3, Johar Town", payment: "payfast", daysAgo: 0, hour: 11, step: 1, items: [["embroidered-kurta-ivory", "Ivory", "", "M", 1], ["printed-chiffon-dupatta-olive", "Olive", "", "", 1]] },
  { name: "Fatima Raza", phone: "03451234503", city: "Islamabad", address: "House 9, Street 14, F-7/2", payment: "cod", daysAgo: 1, hour: 21, step: 0, items: [["printed-lawn-suit-sage", "Sage", "Unstitched", "", 1]] },
  { name: "Mehwish Ali", phone: "03011234504", city: "Faisalabad", address: "P-112, Madina Town", payment: "cod", daysAgo: 1, hour: 16, step: 1, items: [["cambric-shirt-trouser-rust", "Rust", "", "", 1]] },
  { name: "Ayesha Khan", phone: "03001234505", city: "Lahore", address: "House 12, Street 4, DHA Phase 5", payment: "cod", daysAgo: 2, hour: 18, step: 3, items: [["printed-lawn-suit-sage", "Rust", "Stitched", "M", 1], ["printed-lawn-kurta-indigo", "Indigo", "", "S", 1]] },
  { name: "Zainab Sheikh", phone: "03121234506", city: "Multan", address: "House 5, Gulgasht Colony", payment: "payfast", daysAgo: 3, hour: 13, step: 2, items: [["linen-co-ord-set-sand", "Sand", "", "L", 1]] },
  { name: "Maryam Butt", phone: "03221234507", city: "Gujranwala", address: "House 31, Satellite Town", payment: "cod", daysAgo: 4, hour: 19, step: 4, items: [["khaddar-suit-charcoal", "Charcoal", "Unstitched", "", 2]] },
  { name: "Rabia Hassan", phone: "03341234508", city: "Rawalpindi", address: "House 7, Lane 2, Chaklala Scheme 3", payment: "payfast", daysAgo: 5, hour: 12, step: 5, items: [["chikankari-lawn-suit-blush", "Sage", "Stitched", "S", 1]] },
  { name: "Ayesha Khan", phone: "03001234505", city: "Lahore", address: "House 12, Street 4, DHA Phase 5", payment: "payfast", daysAgo: 6, hour: 10, step: 5, items: [["embroidered-kurta-ivory", "Ivory", "", "L", 1]] },
  { name: "Nida Qureshi", phone: "03151234509", city: "Peshawar", address: "House 18, University Town", payment: "cod", daysAgo: 6, hour: 17, step: 0, cancelled: true, items: [["printed-lawn-kurta-indigo", "Indigo", "", "M", 2]] },
  { name: "Saima Javed", phone: "03061234510", city: "Karachi", address: "Bungalow 44, PECHS Block 2", payment: "cod", daysAgo: 9, hour: 15, step: 5, items: [["printed-lawn-suit-sage", "Ivory", "Unstitched", "", 1], ["printed-chiffon-dupatta-olive", "Olive", "", "", 1]] },
  { name: "Hira Malik", phone: "03211234502", city: "Lahore", address: "House 22, Street 3, Johar Town", payment: "cod", daysAgo: 12, hour: 20, step: 5, items: [["cambric-shirt-trouser-rust", "Rust", "", "", 2]] },
];

function sampleId(i: number) {
  return `JZ-9${String(10000 + i * 137).slice(-5)}`;
}

function buildOrder(spec: Spec, i: number, now: number): Order | null {
  const created = new Date(now - spec.daysAgo * DAY - (new Date(now).getHours() - spec.hour) * HOUR);
  const createdAt = (created.getTime() > now ? new Date(now - HOUR) : created).toISOString();
  const lines: OrderLine[] = [];
  for (const [slug, colour, option, size, qty] of spec.items) {
    const p = getProduct(slug);
    if (!p) return null;
    const unitPrice = p.price + (option === "Stitched" ? STITCHING_PRICE : 0);
    lines.push({ slug, name: p.name, colour, option: p.stitchable ? option : "", size, qty, unitPrice, lineTotal: unitPrice * qty, tone: p.tone });
  }
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const delivery = shipping.getRate(spec.city);
  const start = new Date(createdAt).getTime();
  const span = Math.max(HOUR, now - start);
  const times = Array.from({ length: spec.step + 1 }, (_, s) => new Date(start + (span * s) / (DELIVERED_STEP + 1)).toISOString());
  const id = sampleId(i);
  return {
    id,
    createdAt,
    status: spec.cancelled ? "cancelled" : spec.payment === "cod" ? "awaiting-confirmation" : "paid",
    payment: spec.payment,
    customer: { name: spec.name, phone: spec.phone, email: "", city: spec.city, address: spec.address, notes: "", whatsappUpdates: true },
    lines,
    subtotal,
    shipping: delivery,
    total: subtotal + delivery,
    deliveryEstimate: shipping.getEstimate(spec.city),
    fulfilment: spec.step > 0 ? { step: spec.step, times, trackingNumber: spec.step >= 2 ? `TRK-${id.slice(3)}` : undefined } : undefined,
    sample: true,
  };
}

export function buildSampleData(now = Date.now()): { orders: Order[]; returns: ReturnRequest[] } {
  const orders = SPECS.map((s, i) => buildOrder(s, i, now)).filter((o): o is Order => o !== null);
  const rabia = orders[7];
  const ayesha = orders[8];
  const returns: ReturnRequest[] = [
    {
      id: "RT-904101",
      createdAt: new Date(now - 1 * DAY).toISOString(),
      status: "received",
      orderId: ayesha.id,
      phone: ayesha.customer.phone,
      payment: "payfast",
      items: [{ slug: "embroidered-kurta-ivory", name: "Embroidered Kurta, Ivory", variant: "Ivory · Size L", qty: 1 }],
      kind: "exchange",
      exchangeFor: "Size M",
      reason: "Size or fit is not right",
      details: "",
      refundMethod: "",
      accountTitle: "",
      accountNumber: "",
      sample: true,
    },
    {
      id: "RT-904102",
      createdAt: new Date(now - 2 * HOUR).toISOString(),
      status: "received",
      orderId: rabia.id,
      phone: rabia.customer.phone,
      payment: "payfast",
      items: [{ slug: "chikankari-lawn-suit-blush", name: "Chikankari Lawn Suit, Blush", variant: "Sage · Stitched · Size S", qty: 1 }],
      kind: "refund",
      exchangeFor: "",
      reason: "Colour looks different",
      details: "The sage looks greener than in the photos.",
      refundMethod: "",
      accountTitle: "",
      accountNumber: "",
      sample: true,
    },
  ];
  return { orders, returns };
}
