"use client";

import Link from "next/link";
import { LOW_STOCK, useAdminProducts } from "@/lib/admin/product-store";
import { dailySales, summarise } from "@/lib/admin/metrics";
import { adminStage, needsBooking, needsConfirming } from "@/lib/admin/status";
import { formatDate, formatPrice } from "@/lib/format";
import { useHydrated } from "@/lib/local-store";
import { useOrders } from "@/lib/order-store";
import { useReturns } from "@/lib/return-store";
import { SalesChart } from "./SalesChart";
import { SampleDataControls } from "./SampleDataControls";
import { AdminHeading, EmptyNote, Kpi, Panel, StageBadge } from "./ui";

export function AdminDashboard() {
  const hydrated = useHydrated();
  const orders = useOrders();
  const returns = useReturns();
  const products = useAdminProducts();

  if (!hydrated) return <div aria-busy="true" className="min-h-[70vh]" />;

  const week = summarise(orders, returns, "7d");
  const days = dailySales(orders, 7);
  const todo = [
    { label: "Cash-on-delivery orders to confirm", count: orders.filter((o) => needsConfirming(o) && o.payment === "cod").length, href: "/admin/orders?view=to-confirm" },
    { label: "Orders to confirm or book with courier", count: orders.filter((o) => needsConfirming(o) || needsBooking(o)).length, href: "/admin/orders?view=to-do" },
    { label: "Exchange / refund requests", count: returns.filter((r) => r.status === "received").length, href: "/admin/returns" },
    { label: "Products low on stock", count: products.filter((p) => p.status === "active" && p.stock <= LOW_STOCK).length, href: "/admin/products?view=low" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AdminHeading title="Dashboard">
        <SampleDataControls />
      </AdminHeading>

      {orders.length === 0 && (
        <p className="border border-dashed border-line-strong bg-white p-5 text-[15px]">
          No orders yet. Place an order in the store, or press <strong className="font-medium">Load sample data</strong> to
          see the dashboard with realistic demo orders.
        </p>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Kpi label="Sales, last 7 days" value={formatPrice(week.revenue)} note="Excludes unpaid and cancelled" />
        <Kpi label="Orders, last 7 days" value={String(week.orders)} />
        <Kpi label="Average order" value={formatPrice(week.averageOrder)} />
        <Kpi label="Paid cash on delivery" value={`${Math.round(week.codShare * 100)}%`} note="Share of orders" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Panel title="Sales, last 7 days">
          <SalesChart days={days} />
        </Panel>
        <Panel title="Needs attention">
          <ul className="flex flex-col">
            {todo.map((t) => (
              <li key={t.label} className="border-b border-line last:border-b-0">
                <Link href={t.href} className="flex min-h-12 items-center justify-between gap-3 text-[15px] hover:text-emerald">
                  {t.label}
                  <span className={`min-w-8 px-2 text-center font-medium ${t.count > 0 ? "bg-rust-soft text-rust" : "text-muted"}`}>{t.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel
        title="Latest orders"
        action={
          <Link href="/admin/orders" className="text-sm underline underline-offset-4">
            All orders
          </Link>
        }
      >
        {orders.length === 0 ? (
          <EmptyNote>Orders appear here as soon as they are placed.</EmptyNote>
        ) : (
          <ul className="flex flex-col">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3 last:border-b-0 text-[15px]">
                <span className="min-w-[200px]">
                  <Link href={`/admin/orders?open=${o.id}`} className="font-medium underline-offset-4 hover:underline">
                    {o.id}
                  </Link>
                  <span className="block text-sm text-muted">
                    {o.customer.name} · {o.customer.city} · {formatDate(o.createdAt)}
                  </span>
                </span>
                <span className="flex items-center gap-4">
                  <StageBadge stage={adminStage(o)} />
                  <span className="w-24 text-right font-medium">{formatPrice(o.total)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <p className="text-[13px] text-muted">
        Demo: the dashboard reads orders placed in this browser. With the database (Phase 6) it shows every customer&apos;s
        orders.
      </p>
    </div>
  );
}
