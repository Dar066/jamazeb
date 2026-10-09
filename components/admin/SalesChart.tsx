"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";

type Day = { key: string; label: string; revenue: number; orders: number };

/**
 * Single-series column chart of daily sales. Columns are capped at 24px, grow
 * from one baseline, show a tooltip on hover, and the same
 * numbers are available as a table for screen readers.
 */
export function SalesChart({ days }: { days: Day[] }) {
  const [active, setActive] = useState<number | null>(null);
  // At least Rs 1,000 so an empty week still has a sensible scale.
  const max = Math.max(...days.map((d) => d.revenue), 1000);
  const peak = days.reduce((best, d, i) => (d.revenue > days[best].revenue ? i : best), 0);
  // Round the top gridline up to a clean number.
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / step) * step;
  const height = 180;

  return (
    <figure>
      <div className="relative" style={{ height: height + 28 }} aria-hidden="true">
        {[0, 0.5, 1].map((f) => (
          <div key={f} className="absolute right-0 left-14 border-t border-line" style={{ bottom: 28 + f * height }}>
            <span className="absolute -top-2.5 -left-14 w-12 text-right text-[11px] text-muted">
              {axisLabel(top * f)}
            </span>
          </div>
        ))}
        <div className="absolute right-0 bottom-0 left-14 flex h-full items-end">
          {days.map((d, i) => {
            const h = (d.revenue / top) * height;
            return (
              <div key={d.key} className="relative flex h-full flex-1 flex-col items-center justify-end">
                {active === i && (
                  <div className="pointer-events-none absolute z-10 -translate-y-2 border border-line-strong bg-white px-2.5 py-1.5 text-[13px] whitespace-nowrap shadow-sm" style={{ bottom: 28 + h }}>
                    <p className="font-medium">{formatPrice(d.revenue)}</p>
                    <p className="text-muted">
                      {d.orders} {d.orders === 1 ? "order" : "orders"} · {d.label}
                    </p>
                  </div>
                )}
                {i === peak && d.revenue > 0 && active !== i && (
                  <span className="mb-1 text-[11px] text-muted">{Math.round(d.revenue / 1000)}k</span>
                )}
                {/* Hover area is the whole column slot, wider than the bar, so it is easy to hit. */}
                <div
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  className="flex h-full w-full items-end justify-center"
                  style={{ maxHeight: height }}
                >
                  <span className="w-full max-w-6 rounded-t-[4px] bg-emerald" style={{ height: Math.max(h, d.revenue > 0 ? 2 : 0) }} />
                </div>
                <span className="mt-2 h-5 text-[12px] text-muted">{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Wrapped in a hidden div: some browsers draw a table caption even when the table itself is hidden. */}
      <div className="sr-only">
        <table>
          <caption>Sales per day</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Sales</th>
              <th scope="col">Orders</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.key}>
                <th scope="row">{d.key}</th>
                <td>{formatPrice(d.revenue)}</td>
                <td>{d.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

/** 0 · 500 · 1k · 2.5k · 40k */
function axisLabel(value: number): string {
  if (value === 0) return "0";
  if (value < 1000) return String(Math.round(value));
  const k = value / 1000;
  return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
}
