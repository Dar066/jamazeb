"use client";

import { useState } from "react";
import { inRange, ordersCsv, rangeLabels, summarise, type Range } from "@/lib/admin/metrics";
import { dayKey } from "@/lib/admin/metrics";
import { formatPrice } from "@/lib/format";
import { useAdminOrders, useAdminReady, useAdminReturns } from "./AdminData";
import { btnSmall } from "../ui";
import { AdminHeading, EmptyNote, Kpi, Panel, chip } from "./ui";

export function AdminReports() {
  const hydrated = useAdminReady();
  const orders = useAdminOrders();
  const returns = useAdminReturns();
  const [range, setRange] = useState<Range>("30d");

  if (!hydrated) return <div aria-busy="true" className="min-h-[70vh]" />;

  const s = summarise(orders, returns, range);
  const cod = Math.round(s.codShare * 100);
  const maxCity = Math.max(1, ...s.byCity.map((c) => c.n));

  function download() {
    const csv = ordersCsv(orders.filter((o) => inRange(o, range)));
    // Byte-order mark so Excel opens the file as UTF-8.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jamazeb-orders-${range}-${dayKey(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminHeading title="Reports">
        <button type="button" onClick={download} disabled={orders.length === 0} className={`${btnSmall} disabled:cursor-not-allowed disabled:opacity-50`}>
          Download orders (CSV)
        </button>
      </AdminHeading>

      <div role="group" aria-label="Time range" className="flex flex-wrap gap-2">
        {(Object.keys(rangeLabels) as Range[]).map((r) => (
          <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)} className={chip(range === r)}>
            {rangeLabels[r]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Kpi label="Sales" value={formatPrice(s.revenue)} />
        <Kpi label="Orders" value={String(s.orders)} />
        <Kpi label="Average order" value={formatPrice(s.averageOrder)} />
        <Kpi label="Orders with a return request" value={`${Math.round(s.returnRate * 100)}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Payment method">
          {s.orders === 0 ? (
            <EmptyNote>No orders in this period.</EmptyNote>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex h-3 w-full overflow-hidden rounded-[4px] bg-line" role="img" aria-label={`Cash on delivery ${cod}%, paid online ${100 - cod}%`}>
                <span className="h-full bg-emerald" style={{ width: `${cod}%` }} />
              </div>
              <dl className="flex flex-col gap-1 text-[15px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2">
                    <span aria-hidden="true" className="h-3 w-3 rounded-[2px] bg-emerald" />
                    Cash on delivery
                  </dt>
                  <dd className="font-medium">{cod}%</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2">
                    <span aria-hidden="true" className="h-3 w-3 rounded-[2px] bg-line" />
                    Paid online (PayFast)
                  </dt>
                  <dd className="font-medium">{100 - cod}%</dd>
                </div>
              </dl>
            </div>
          )}
        </Panel>

        <Panel title="Top products">
          {s.topProducts.length === 0 ? (
            <EmptyNote>No sales in this period.</EmptyNote>
          ) : (
            <ol className="flex flex-col">
              {s.topProducts.map((p, i) => (
                <li key={p.name} className="flex justify-between gap-3 border-b border-line py-2 text-[15px] last:border-b-0">
                  <span>
                    <span className="mr-2 text-muted">{i + 1}.</span>
                    {p.name}
                  </span>
                  <span className="shrink-0 text-muted">
                    {p.units} sold · {formatPrice(p.revenue)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <Panel title="Orders by city">
        {s.byCity.length === 0 ? (
          <EmptyNote>No orders in this period.</EmptyNote>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {s.byCity.map((c) => (
              <li key={c.city} className="grid grid-cols-[110px_1fr] items-center gap-3 text-[15px]">
                <span>{c.city}</span>
                <span className="flex items-center gap-2">
                  <span className="h-5 rounded-r-[4px] bg-emerald" style={{ width: `${(c.n / maxCity) * 85}%`, minWidth: 4 }} />
                  <span className="text-[13px]">{c.n}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <p className="text-[13px] text-muted">Sales leave out unpaid and cancelled orders. The CSV opens in Excel or Google Sheets.</p>
    </div>
  );
}
