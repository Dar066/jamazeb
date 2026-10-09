"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { DELIVERED_STEP, advanceFulfilment, currentStep, displayStatus, isActiveOrder, matchOrder, returnEligibility } from "@/lib/fulfilment";
import { formatDate, formatPrice } from "@/lib/format";
import { useHydrated } from "@/lib/local-store";
import { updateOrder, useOrders } from "@/lib/order-store";
import type { Order } from "@/lib/orders";
import { normalizePkMobile } from "@/lib/validation";
import { openChat } from "./ChatWidget";
import { ChatIcon } from "./icons";
import { OrderTimeline } from "./OrderTimeline";
import { btnPrimary, btnSecondary, fieldBorder, fieldInput, fieldLabel } from "./ui";

/**
 * Order lookup by order number + mobile number. Opening /track?order=JZ-… from
 * the account page shows that order straight away, since it was placed on this device.
 */
export function TrackOrder() {
  const params = useSearchParams();
  const linked = params.get("order")?.toUpperCase() ?? "";
  const orders = useOrders();
  const hydrated = useHydrated();

  const [orderId, setOrderId] = useState(linked);
  const [phone, setPhone] = useState("");
  const [foundId, setFoundId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const shownId = foundId ?? (linked && hydrated ? matchOrder(orders, linked, null)?.id : undefined);
  const order = shownId ? orders.find((o) => o.id === shownId) : undefined;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const mobile = normalizePkMobile(phone);
    if (!/^JZ-?[0-9]{6}$/i.test(orderId.trim())) {
      setError("Enter your order number, like JZ-123456.");
      return;
    }
    if (!mobile) {
      setError("Enter the mobile number you used at checkout, like 0300 1234567.");
      return;
    }
    const id = orderId.trim().toUpperCase().replace(/^JZ-?/, "JZ-");
    const match = matchOrder(orders, id, mobile);
    if (!match) {
      setFoundId(null);
      setError(
        "We couldn't find an order with that order number and mobile number on this device. Check both, or message us on WhatsApp and we'll look it up.",
      );
      return;
    }
    setError("");
    setFoundId(match.id);
  }

  return (
    <div className="flex flex-col gap-10">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          <div>
            <label htmlFor="order" className={fieldLabel}>
              Order number
            </label>
            <input
              id="order"
              name="order"
              placeholder="JZ-123456"
              autoCapitalize="characters"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className={`${fieldInput} ${fieldBorder(error)}`}
            />
          </div>
          <div>
            <label htmlFor="phone" className={fieldLabel}>
              Mobile number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0300 1234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`${fieldInput} ${fieldBorder(error)}`}
            />
          </div>
        </div>
        <div aria-live="polite">
          {error && (
            <p role="alert" className="text-sm text-rust">
              {error}
            </p>
          )}
        </div>
        <button type="submit" className={`${btnPrimary} self-start`}>
          Track order
        </button>
      </form>

      {order && <OrderStatusCard order={order} />}
    </div>
  );
}

function OrderStatusCard({ order }: { order: Order }) {
  const active = isActiveOrder(order);
  const step = currentStep(order);
  const returns = returnEligibility(order);

  return (
    <section aria-labelledby="status-title" className="flex flex-col gap-6 border border-line bg-white p-6">
      <h2 id="status-title" className="sr-only">
        Order {order.id}
      </h2>
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 text-[15px]">
        <div>
          <dt className="text-sm text-muted">Order</dt>
          <dd className="font-medium">{order.id}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Status</dt>
          <dd className="font-medium text-emerald" aria-live="polite">
            {displayStatus(order)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Courier</dt>
          <dd>{order.fulfilment?.trackingNumber ? `Demo courier · ${order.fulfilment.trackingNumber}` : "Booked once packed"}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Payment</dt>
          <dd>
            {order.payment === "cod" ? "Cash on delivery" : "Paid online"} · {formatPrice(order.total)}
          </dd>
        </div>
      </dl>

      {active ? (
        <>
          <OrderTimeline order={order} />
          {step < DELIVERED_STEP && (
            <p className="text-sm text-muted">
              Placed {formatDate(order.createdAt)}. Arrives {order.deliveryEstimate} of ordering.
            </p>
          )}
          {returns.eligible && (
            <p className="bg-emerald-soft p-4 text-[15px] text-emerald">
              Exchange or refund open until {formatDate(returns.closesAt)} ({returns.daysLeft}{" "}
              {returns.daysLeft === 1 ? "day" : "days"} left).{" "}
              <Link href={`/returns?order=${order.id}`} className="underline underline-offset-4">
                Request an exchange or refund
              </Link>
            </p>
          )}
        </>
      ) : (
        <p className="text-[15px]">
          This order hasn&apos;t been paid, so it won&apos;t be dispatched.{" "}
          <Link href="/checkout" className="underline underline-offset-4">
            Go to checkout
          </Link>
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => openChat(`Hi, I have a question about my order ${order.id}.`)} className={btnSecondary}>
          <ChatIcon size={20} /> Ask about this order on WhatsApp
        </button>
      </div>

      {active && (
        <div className="border-t border-dashed border-line-strong pt-4">
          <p className="mb-3 text-sm text-muted">
            Demo only: on the live store, the courier and the admin dashboard update this status.
          </p>
          <button
            type="button"
            disabled={step >= DELIVERED_STEP}
            onClick={() => updateOrder(order.id, (o) => advanceFulfilment(o))}
            className="min-h-11 cursor-pointer border border-dashed border-charcoal px-4 text-[13px] tracking-[0.08em] uppercase disabled:cursor-not-allowed disabled:border-line-strong disabled:text-muted"
          >
            {step >= DELIVERED_STEP ? "Delivered" : "Demo: move to next status"}
          </button>
        </div>
      )}
    </section>
  );
}
