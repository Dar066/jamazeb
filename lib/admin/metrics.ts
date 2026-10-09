// Sales figures for the dashboard and reports, worked out from the orders.
// Unpaid and cancelled orders don't count as sales.

import { isActiveOrder } from "../fulfilment";
import type { Order } from "../orders";
import type { ReturnRequest } from "../returns";

const DAY = 24 * 60 * 60 * 1000;
const TZ = "Asia/Karachi";

/** "2026-10-09" in Pakistan time, so days split at local midnight. */
export function dayKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: TZ });
}

export type Range = "7d" | "30d" | "all";
export const rangeLabels: Record<Range, string> = { "7d": "Last 7 days", "30d": "Last 30 days", all: "All time" };

export function inRange(order: Order, range: Range, now = new Date()): boolean {
  if (range === "all") return true;
  const days = range === "7d" ? 7 : 30;
  return now.getTime() - new Date(order.createdAt).getTime() < days * DAY;
}

export function summarise(orders: Order[], returns: ReturnRequest[], range: Range, now = new Date()) {
  const inScope = orders.filter((o) => inRange(o, range, now));
  const sold = inScope.filter(isActiveOrder);
  const revenue = sold.reduce((sum, o) => sum + o.total, 0);
  const cod = sold.filter((o) => o.payment === "cod").length;
  const soldIds = new Set(sold.map((o) => o.id));
  const returned = new Set(returns.filter((r) => soldIds.has(r.orderId)).map((r) => r.orderId)).size;

  const units = new Map<string, { name: string; units: number; revenue: number }>();
  const cities = new Map<string, number>();
  for (const o of sold) {
    cities.set(o.customer.city, (cities.get(o.customer.city) ?? 0) + 1);
    for (const l of o.lines) {
      const row = units.get(l.slug) ?? { name: l.name, units: 0, revenue: 0 };
      row.units += l.qty;
      row.revenue += l.lineTotal;
      units.set(l.slug, row);
    }
  }

  return {
    orders: sold.length,
    revenue,
    averageOrder: sold.length ? Math.round(revenue / sold.length) : 0,
    codShare: sold.length ? cod / sold.length : 0,
    returnRate: sold.length ? returned / sold.length : 0,
    topProducts: [...units.values()].sort((a, b) => b.units - a.units || b.revenue - a.revenue).slice(0, 5),
    byCity: [...cities.entries()].map(([city, n]) => ({ city, n })).sort((a, b) => b.n - a.n),
  };
}

/** Sales per day for the last `days` days, oldest first. */
export function dailySales(orders: Order[], days = 7, now = new Date()) {
  const rows: { key: string; label: string; revenue: number; orders: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY);
    rows.push({ key: dayKey(d), label: d.toLocaleDateString("en-GB", { weekday: "short", timeZone: TZ }), revenue: 0, orders: 0 });
  }
  const byKey = new Map(rows.map((r) => [r.key, r]));
  for (const o of orders.filter(isActiveOrder)) {
    const row = byKey.get(dayKey(new Date(o.createdAt)));
    if (row) {
      row.revenue += o.total;
      row.orders += 1;
    }
  }
  return rows;
}

export type CustomerRow = { phone: string; name: string; city: string; orders: number; spent: number; lastOrder: string };

/** Customers grouped by mobile number. */
export function customers(orders: Order[]): CustomerRow[] {
  const map = new Map<string, CustomerRow>();
  for (const o of orders) {
    const row = map.get(o.customer.phone) ?? { phone: o.customer.phone, name: o.customer.name, city: o.customer.city, orders: 0, spent: 0, lastOrder: o.createdAt };
    row.orders += 1;
    if (isActiveOrder(o)) row.spent += o.total;
    if (o.createdAt >= row.lastOrder) {
      row.lastOrder = o.createdAt;
      row.name = o.customer.name;
      row.city = o.customer.city;
    }
    map.set(o.customer.phone, row);
  }
  return [...map.values()].sort((a, b) => b.lastOrder.localeCompare(a.lastOrder));
}

/** Orders as CSV for Excel or Google Sheets. Cells that could run as formulas are neutralised. */
export function ordersCsv(orders: Order[]): string {
  const cell = (v: string | number) => {
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ["Order", "Date", "Customer", "Mobile", "City", "Payment", "Status", "Items", "Subtotal", "Delivery", "Total"];
  const rows = orders.map((o) => [
    o.id,
    dayKey(new Date(o.createdAt)),
    o.customer.name,
    o.customer.phone,
    o.customer.city,
    o.payment === "cod" ? "Cash on delivery" : "PayFast",
    o.status,
    o.lines.map((l) => `${l.name} x${l.qty}`).join("; "),
    o.subtotal,
    o.shipping,
    o.total,
  ]);
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}
