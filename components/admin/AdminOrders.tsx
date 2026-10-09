"use client";

import { useSearchParams } from "next/navigation";
import { Fragment, useState } from "react";
import { adminStage, moveOn, nextAction, type AdminStage } from "@/lib/admin/status";
import { describeVariant } from "@/lib/cart-pricing";
import { currentStep } from "@/lib/fulfilment";
import { formatDate, formatPrice } from "@/lib/format";
import { useHydrated } from "@/lib/local-store";
import { setOrderStatus, updateOrder, useOrders } from "@/lib/order-store";
import type { Order } from "@/lib/orders";
import { OrderTimeline } from "../OrderTimeline";
import { btnSmall } from "../ui";
import { SampleDataControls } from "./SampleDataControls";
import { AdminHeading, EmptyNote, StageBadge, chip, searchInput, td, th } from "./ui";

const VIEWS: { id: string; label: string; match: (s: AdminStage) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "to-do", label: "To do", match: (s) => s === "to-confirm" || s === "confirmed" },
  { id: "to-confirm", label: "To confirm", match: (s) => s === "to-confirm" },
  { id: "on-the-way", label: "On the way", match: (s) => s === "booked" || s === "in-transit" || s === "out-for-delivery" },
  { id: "delivered", label: "Delivered", match: (s) => s === "delivered" },
  { id: "closed", label: "Cancelled / not paid", match: (s) => s === "cancelled" || s === "unpaid" },
];

export function AdminOrders() {
  const params = useSearchParams();
  return <OrdersView key={params.toString()} initialView={params.get("view") ?? "all"} initialOpen={params.get("open")} />;
}

function OrdersView({ initialView, initialOpen }: { initialView: string; initialOpen: string | null }) {
  const hydrated = useHydrated();
  const orders = useOrders();
  const [view, setView] = useState(VIEWS.some((v) => v.id === initialView) ? initialView : "all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(initialOpen);

  if (!hydrated) return <div aria-busy="true" className="min-h-[70vh]" />;

  const q = query.trim().toLowerCase();
  const matchView = VIEWS.find((v) => v.id === view)!.match;
  const shown = orders.filter(
    (o) => matchView(adminStage(o)) && (!q || [o.id, o.customer.name, o.customer.city, o.customer.phone].join(" ").toLowerCase().includes(q)),
  );

  return (
    <div className="flex flex-col gap-5">
      <AdminHeading title="Orders">
        <SampleDataControls />
      </AdminHeading>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Show orders" className="flex flex-wrap gap-2">
          {VIEWS.map((v) => {
            const n = orders.filter((o) => v.match(adminStage(o))).length;
            return (
              <button key={v.id} type="button" aria-pressed={view === v.id} onClick={() => setView(v.id)} className={chip(view === v.id)}>
                {v.label} <span className="opacity-70">({n})</span>
              </button>
            );
          })}
        </div>
        <label className="w-full max-w-[280px]">
          <span className="sr-only">Search orders</span>
          <input type="search" placeholder="Search order, name, city, mobile" value={query} onChange={(e) => setQuery(e.target.value)} className={searchInput} />
        </label>
      </div>

      <div className="overflow-x-auto border border-line bg-white">
        {shown.length === 0 ? (
          <EmptyNote>{orders.length === 0 ? "No orders yet." : "No orders match this view."}</EmptyNote>
        ) : (
          <table className="w-full min-w-[860px] border-collapse">
            <caption className="sr-only">Orders</caption>
            <thead>
              <tr>
                <th scope="col" className={th}>Order</th>
                <th scope="col" className={th}>Customer</th>
                <th scope="col" className={th}>Payment</th>
                <th scope="col" className={`${th} text-right`}>Total</th>
                <th scope="col" className={th}>Status</th>
                <th scope="col" className={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <Fragment key={o.id}>
                  <OrderRow order={o} open={open === o.id} onToggle={() => setOpen(open === o.id ? null : o.id)} />
                  {open === o.id && (
                    <tr>
                      <td colSpan={6} className="border-b border-line bg-ivory px-5 py-5">
                        <OrderDetails order={o} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-[13px] text-muted">
        &ldquo;Book courier&rdquo; uses the demo courier and creates a demo tracking number. The real courier (PostEx, Trax,
        Leopards…) is connected per client.
      </p>
    </div>
  );
}

function OrderRow({ order: o, open, onToggle }: { order: Order; open: boolean; onToggle: () => void }) {
  const action = nextAction(o);
  return (
    <tr className={open ? "bg-ivory" : undefined}>
      <td className={td}>
        <button type="button" onClick={onToggle} aria-expanded={open} className="cursor-pointer text-left font-medium underline-offset-4 hover:underline">
          {o.id}
        </button>
        <span className="block text-[13px] text-muted">{formatDate(o.createdAt)}</span>
      </td>
      <td className={td}>
        {o.customer.name}
        <span className="block text-[13px] text-muted">{o.customer.city}</span>
      </td>
      <td className={td}>{o.payment === "cod" ? "Cash on delivery" : "PayFast"}</td>
      <td className={`${td} text-right font-medium`}>{formatPrice(o.total)}</td>
      <td className={td}>
        <StageBadge stage={adminStage(o)} />
        {o.fulfilment?.trackingNumber && <span className="mt-1 block text-[13px] text-muted">{o.fulfilment.trackingNumber}</span>}
      </td>
      <td className={td}>
        {action ? (
          <button type="button" onClick={() => updateOrder(o.id, moveOn)} className={btnSmall} aria-label={`${action}: ${o.id}`}>
            {action}
          </button>
        ) : (
          <button type="button" onClick={onToggle} className="min-h-11 cursor-pointer text-sm text-muted underline underline-offset-4">
            {open ? "Hide details" : "Details"}
          </button>
        )}
      </td>
    </tr>
  );
}

function OrderDetails({ order: o }: { order: Order }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const stage = adminStage(o);
  const canCancel = (stage === "to-confirm" || stage === "confirmed") && currentStep(o) < 2;
  const waNumber = `92${o.customer.phone.slice(1)}`;
  const waText = encodeURIComponent(`Assalam o Alaikum ${o.customer.name.split(" ")[0]}, this is Jamazeb about your order ${o.id}.`);

  return (
    <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-4">
        <h3 className="font-medium">Items</h3>
        <ul className="flex flex-col gap-2 text-[15px]">
          {o.lines.map((l) => (
            <li key={[l.slug, l.colour, l.option, l.size].join("|")} className="flex justify-between gap-4">
              <span>
                {l.name}
                <span className="block text-[13px] text-muted">
                  {describeVariant(l)} · Qty {l.qty} · {formatPrice(l.unitPrice)} each
                </span>
              </span>
              <span className="shrink-0">{formatPrice(l.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-1 border-t border-line pt-3 text-[15px]">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(o.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Delivery ({o.customer.city})</dt><dd>{formatPrice(o.shipping)}</dd></div>
          <div className="flex justify-between font-medium"><dt>Total</dt><dd>{formatPrice(o.total)}</dd></div>
        </dl>
        <div className="text-[15px]">
          <h3 className="mb-1 font-medium">Deliver to</h3>
          <p>{o.customer.name} · {o.customer.phone}</p>
          <p className="text-muted">{o.customer.address}, {o.customer.city}</p>
          {o.customer.notes && <p className="text-muted">Note: {o.customer.notes}</p>}
          {o.customer.email && <p className="text-muted">{o.customer.email}</p>}
          <p className="mt-1 text-[13px] text-muted">{o.customer.whatsappUpdates ? "Wants updates on WhatsApp" : "No WhatsApp updates"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`https://wa.me/${waNumber}?text=${waText}`} target="_blank" rel="noopener noreferrer" className={btnSmall}>
            WhatsApp customer
          </a>
          {canCancel &&
            (confirmCancel ? (
              <>
                <button type="button" onClick={() => setOrderStatus(o.id, "cancelled")} className={`${btnSmall} border-rust text-rust`}>
                  Yes, cancel order
                </button>
                <button type="button" onClick={() => setConfirmCancel(false)} className={btnSmall}>
                  Keep order
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmCancel(true)} className={btnSmall}>
                Cancel order
              </button>
            ))}
        </div>
      </div>
      <div>
        <h3 className="mb-3 font-medium">Progress</h3>
        {stage === "cancelled" || stage === "unpaid" ? (
          <p className="text-[15px] text-muted">{stage === "cancelled" ? "This order was cancelled." : "Payment was not completed, so there is nothing to send."}</p>
        ) : (
          <OrderTimeline order={o} />
        )}
      </div>
    </div>
  );
}
