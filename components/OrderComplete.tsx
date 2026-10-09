"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { describeVariant } from "@/lib/cart-pricing";
import { clearCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { useHydrated } from "@/lib/local-store";
import { getOrder, mergeOrders, setOrderStatus, useOrders } from "@/lib/order-store";
import type { Order, OrderStatus } from "@/lib/orders";
import type { PaymentOutcome, PaymentResult } from "@/lib/payments/types";
import { site } from "@/lib/site";
import { openChat } from "./ChatWidget";
import { ChatIcon } from "./icons";

const STATUS_FOR: Record<PaymentOutcome, OrderStatus> = {
  paid: "paid",
  failed: "payment-failed",
  cancelled: "payment-cancelled",
};

const primary = "flex min-h-[52px] items-center justify-center gap-2.5 bg-emerald px-6 text-sm tracking-[0.12em] text-white uppercase";
const secondary =
  "flex min-h-[52px] cursor-pointer items-center justify-center gap-2.5 border border-charcoal px-6 text-sm tracking-[0.12em] text-charcoal uppercase";

/** Order confirmation, and the return point from the payment page. */
export function OrderComplete() {
  const params = useSearchParams();
  // Each result address gets fresh state, so one order's status never shows on another's page.
  return (
    <OrderResult
      key={params.toString()}
      id={params.get("order") ?? ""}
      outcome={params.get("outcome")}
      amount={params.get("amount")}
      sig={params.get("sig")}
    />
  );
}

type ResultProps = { id: string; outcome: string | null; amount: string | null; sig: string | null };

function OrderResult({ id, outcome, amount, sig }: ResultProps) {

  const hydrated = useHydrated();
  const order = useOrders().find((o) => o.id === id);
  const [check, setCheck] = useState<"checking" | "valid" | "invalid">(outcome ? "checking" : "valid");

  // Returning from the payment page: have the server verify the signed result
  // before the order is shown as paid.
  useEffect(() => {
    if (!outcome || !hydrated) return;
    let cancelled = false;
    (async () => {
      let result: (PaymentResult & { order?: Order | null }) | null = null;
      try {
        const res = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: id, amount, outcome, sig }),
        });
        result = (await res.json()) as PaymentResult & { order?: Order | null };
      } catch {
        result = null;
      }
      if (cancelled) return;

      const before = getOrder(id);
      // With a database the server sends the order as recorded there; otherwise this device's copy is used.
      const current = result?.order ?? before;
      if (!result?.valid || !current || current.payment !== "payfast" || current.total !== result.amount) {
        setCheck("invalid");
        return;
      }
      if (result.order) {
        mergeOrders([result.order]);
      } else if (current.status !== "paid" && current.status !== "cancelled") {
        // A paid order never goes back to unpaid, e.g. if an old result page is reopened.
        setOrderStatus(id, STATUS_FOR[result.outcome]);
      }
      if (result.outcome === "paid" && before?.status !== "paid" && (result.order?.status ?? "paid") === "paid") clearCart();
      setCheck("valid");
    })();
    return () => {
      cancelled = true;
    };
  }, [outcome, hydrated, id, amount, sig]);

  if (!hydrated || check === "checking") {
    return (
      <p role="status" className="text-lg">
        {outcome ? "Confirming your payment…" : ""}
      </p>
    );
  }

  if (check === "invalid") {
    return (
      <Message title="We couldn't confirm this payment">
        <p>
          The payment result for order {id || "unknown"} could not be verified, so the order has not been marked as paid.
          If money was taken from your account, message us with your order number and we&apos;ll sort it out.
        </p>
        <Actions>
          <button type="button" onClick={() => openChat(`Hi, I need help with the payment for order ${id}.`)} className={secondary}>
            <ChatIcon size={20} /> Message us
          </button>
          <Link href="/cart" className={primary}>
            Back to cart
          </Link>
        </Actions>
      </Message>
    );
  }

  if (!order) {
    return (
      <Message title="Order not found">
        <p>We can&apos;t find {id ? `order ${id}` : "this order"} in this browser. Orders are saved on the device they were placed from.</p>
        <Actions>
          <Link href="/collections/new-in" className={primary}>
            Continue shopping
          </Link>
        </Actions>
      </Message>
    );
  }

  if (order.status === "cancelled") {
    return (
      <Message title="This order was cancelled">
        <p>Order {order.id} was cancelled by the store. If you have a question about it, message us on WhatsApp.</p>
        <Actions>
          <button type="button" onClick={() => openChat(`Hi, I have a question about order ${id}.`)} className={secondary}>
            <ChatIcon size={20} /> Message us
          </button>
          <Link href="/collections/new-in" className={primary}>
            Continue shopping
          </Link>
        </Actions>
      </Message>
    );
  }

  if (order.status === "payment-failed" || order.status === "payment-cancelled" || order.status === "awaiting-payment") {
    const title =
      order.status === "payment-failed"
        ? "Your payment was declined"
        : order.status === "payment-cancelled"
          ? "Payment cancelled"
          : "Payment not completed";
    return (
      <Message title={title}>
        <p>
          Order {order.id} has not been paid, and nothing was charged. Your cart is saved, so you can try again or pay cash on
          delivery instead.
        </p>
        <Actions>
          {order.paymentUrl && (
            <Link href={order.paymentUrl} className={primary}>
              Try payment again
            </Link>
          )}
          <Link href="/checkout" className={secondary}>
            Back to checkout
          </Link>
        </Actions>
      </Message>
    );
  }

  return <Confirmation order={order} />;
}

function Confirmation({ order }: { order: Order }) {
  const { customer } = order;
  const contact = customer.whatsappUpdates ? `send a WhatsApp message to ${customer.phone}` : `call ${customer.phone}`;
  const confirmText =
    order.status === "paid"
      ? `Payment of ${formatPrice(order.total)} received. We'll ${contact} when your parcel is on its way.`
      : `We'll ${contact} to confirm your order before it's dispatched. Please keep ${formatPrice(order.total)} ready for the rider.`;

  const whatsappMessage = `Hi, I just placed order ${order.id} (${formatPrice(order.total)}, ${
    order.status === "paid" ? "paid online" : "cash on delivery"
  }). Please confirm. ${site.url}`;

  return (
    <div className="flex flex-col gap-10">
      <Message title="Thank you, your order is placed">
        <p className="text-sm tracking-[0.1em] text-muted uppercase">
          Order number <span className="font-medium text-charcoal">{order.id}</span>
        </p>
        <p>{confirmText}</p>
        <Actions>
          <button type="button" onClick={() => openChat(whatsappMessage)} className={secondary}>
            <ChatIcon size={20} /> Confirm on WhatsApp
          </button>
          <Link href={`/track?order=${order.id}`} className={secondary}>
            Track your order
          </Link>
          <Link href="/collections/new-in" className={primary}>
            Continue shopping
          </Link>
        </Actions>
      </Message>

      <section aria-labelledby="details-title" className="mx-auto flex w-full max-w-[680px] flex-col gap-4 bg-sand p-6">
        <h2 id="details-title" className="font-serif text-[28px] font-medium">
          Order details
        </h2>
        <ul className="flex flex-col gap-4">
          {order.lines.map((l) => (
            <li key={[l.slug, l.colour, l.option, l.size].join("|")} className="flex justify-between gap-4 text-[15px]">
              <div className="min-w-0">
                <p>{l.name}</p>
                <p className="text-sm text-muted">
                  {describeVariant(l)} · Qty {l.qty}
                </p>
              </div>
              <p className="shrink-0">{formatPrice(l.lineTotal)}</p>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-3 border-t border-line-strong pt-4 text-[15px]">
          <div className="flex justify-between gap-4">
            <dt>Subtotal</dt>
            <dd>{formatPrice(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Delivery ({customer.city})</dt>
            <dd>{formatPrice(order.shipping)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line-strong pt-3 text-lg font-medium">
            <dt>Total</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Payment</dt>
            <dd>{order.status === "paid" ? "Paid online" : "Cash on delivery"}</dd>
          </div>
        </dl>
        <div className="border-t border-line-strong pt-4 text-[15px]">
          <p className="font-medium">Delivering to</p>
          <p>{customer.name}</p>
          <p>
            {customer.address}, {customer.city}
          </p>
          {customer.notes && <p className="text-muted">Note: {customer.notes}</p>}
          <p className="mt-3 text-sm text-muted">
            Delivery {order.deliveryEstimate}. Exchange or refund within {site.exchangeWindowDays} days of delivery.
          </p>
        </div>
      </section>
    </div>
  );
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[680px] flex-col items-center gap-5 text-center">
      <h1 className="font-serif text-[40px] leading-tight font-medium sm:text-[48px]">{title}</h1>
      {children}
    </div>
  );
}

function Actions({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 flex flex-wrap justify-center gap-3">{children}</div>;
}
