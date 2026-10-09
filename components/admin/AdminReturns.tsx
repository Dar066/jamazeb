"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";
import { useHydrated } from "@/lib/local-store";
import { useOrders } from "@/lib/order-store";
import { setReturnStatus, useReturns } from "@/lib/return-store";
import { stepTime, DELIVERED_STEP } from "@/lib/fulfilment";
import type { ReturnStatus } from "@/lib/returns";
import { btnSmall } from "../ui";
import { AdminHeading, EmptyNote, chip } from "./ui";

const statusText: Record<ReturnStatus, string> = { received: "Waiting for review", approved: "Approved", rejected: "Rejected" };

export function AdminReturns() {
  const hydrated = useHydrated();
  const returns = useReturns();
  const orders = useOrders();
  const [view, setView] = useState<"open" | "all">("open");

  if (!hydrated) return <div aria-busy="true" className="min-h-[70vh]" />;

  const shown = view === "open" ? returns.filter((r) => r.status === "received") : returns;

  return (
    <div className="flex flex-col gap-5">
      <AdminHeading title="Exchanges & refunds" />
      <div role="group" aria-label="Show requests" className="flex gap-2">
        <button type="button" aria-pressed={view === "open"} onClick={() => setView("open")} className={chip(view === "open")}>
          To review ({returns.filter((r) => r.status === "received").length})
        </button>
        <button type="button" aria-pressed={view === "all"} onClick={() => setView("all")} className={chip(view === "all")}>
          All ({returns.length})
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="border border-line bg-white">
          <EmptyNote>{returns.length === 0 ? "No requests yet." : "Nothing waiting for review."}</EmptyNote>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {shown.map((r) => {
            const order = orders.find((o) => o.id === r.orderId);
            const delivered = order ? stepTime(order, DELIVERED_STEP) : undefined;
            return (
              <li key={r.id} className="flex flex-col gap-3 border border-line bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-medium">
                      {r.id} · {r.kind === "exchange" ? "Exchange" : "Refund"} · order {r.orderId}
                    </h2>
                    <p className="text-sm text-muted">
                      {order?.customer.name ?? "Customer"} · {r.phone} · requested {formatDate(r.createdAt)}
                      {delivered && `, delivered ${formatDate(delivered)}`}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-[13px] ${r.status === "received" ? "bg-rust-soft text-rust" : r.status === "approved" ? "bg-emerald-soft text-emerald" : "bg-white text-muted ring-1 ring-line-strong ring-inset"}`}>
                    {statusText[r.status]}
                  </span>
                </div>
                <ul className="text-[15px]">
                  {r.items.map((i) => (
                    <li key={i.slug + i.variant}>
                      {i.name} <span className="text-muted">· {i.variant} · Qty {i.qty}</span>
                    </li>
                  ))}
                </ul>
                <dl className="grid gap-x-6 gap-y-1 text-[15px] sm:grid-cols-[auto_1fr]">
                  <dt className="text-muted">Reason</dt>
                  <dd>{r.reason}</dd>
                  {r.details && (
                    <>
                      <dt className="text-muted">Details</dt>
                      <dd>{r.details}</dd>
                    </>
                  )}
                  {r.kind === "exchange" && (
                    <>
                      <dt className="text-muted">Wants instead</dt>
                      <dd>{r.exchangeFor}</dd>
                    </>
                  )}
                  {r.kind === "refund" && (
                    <>
                      <dt className="text-muted">Refund to</dt>
                      <dd>{r.payment === "payfast" ? "Original card or wallet (PayFast)" : `${r.refundMethod} · ${r.accountTitle} · ${r.accountNumber}`}</dd>
                    </>
                  )}
                </dl>
                {r.status === "received" ? (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setReturnStatus(r.id, "approved")} className={`${btnSmall} border-emerald bg-emerald text-white`}>
                      Approve
                    </button>
                    <button type="button" onClick={() => setReturnStatus(r.id, "rejected")} className={btnSmall}>
                      Reject
                    </button>
                  </div>
                ) : (
                  r.decidedAt && <p className="text-[13px] text-muted">{statusText[r.status]} on {formatDate(r.decidedAt)}. The customer sees this in their account.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-[13px] text-muted">
        After approving, book a courier pickup and send the customer the details on WhatsApp. Refunds are due within 5 working
        days of receiving the item.
      </p>
    </div>
  );
}
