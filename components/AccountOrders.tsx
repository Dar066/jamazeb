"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { currentUnitPrice, describeVariant } from "@/lib/cart-pricing";
import { addToCart } from "@/lib/cart-store";
import { getProduct } from "@/lib/catalog";
import { DELIVERED_STEP, currentStep, displayStatus, isActiveOrder, returnEligibility } from "@/lib/fulfilment";
import { formatDate, formatPrice } from "@/lib/format";
import { useHydrated } from "@/lib/local-store";
import { useOrders } from "@/lib/order-store";
import type { Order } from "@/lib/orders";
import { syncLocalOrders } from "@/lib/order-sync";
import { useReturns } from "@/lib/return-store";
import { returnStatusLabels } from "@/lib/returns";
import { site } from "@/lib/site";
import { btnPrimary, btnSmall } from "./ui";

export function AccountOrders() {
  // Sample orders loaded from the admin dashboard belong to other (demo) customers.
  const orders = useOrders().filter((o) => !o.sample);
  const returns = useReturns().filter((r) => !r.sample);
  const hydrated = useHydrated();

  // Show the store's latest updates (status, return decisions) for these orders.
  useEffect(() => {
    void syncLocalOrders();
  }, []);

  if (!hydrated) return <div aria-busy="true" className="min-h-[50vh]" />;

  return (
    <div className="flex flex-col gap-12">
      <section aria-labelledby="orders-title">
        <h1 id="orders-title" className="mb-6 font-serif text-[40px] leading-tight font-medium">
          My orders
        </h1>
        {orders.length === 0 ? (
          <div className="flex flex-col items-start gap-5">
            <p className="text-lg">You haven&apos;t placed any orders on this device yet.</p>
            <Link href="/collections/new-in" className={btnPrimary}>
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </ul>
        )}
      </section>

      {returns.length > 0 && (
        <section aria-labelledby="returns-title">
          <h2 id="returns-title" className="mb-4 font-serif text-[28px] font-medium">
            Exchange &amp; refund requests
          </h2>
          <ul className="flex flex-col gap-3">
            {returns.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 border border-line bg-white p-5 text-[15px]">
                <div>
                  <p className="font-medium">
                    {r.id} · {r.kind === "exchange" ? "Exchange" : "Refund"}
                  </p>
                  <p className="text-sm text-muted">
                    Order {r.orderId} · Sent {formatDate(r.createdAt)} · {r.items.map((i) => i.name).join(", ")}
                  </p>
                </div>
                <p className={`text-sm ${r.status === "rejected" ? "text-rust" : "text-emerald"}`}>
                  {returnStatusLabels[r.status] ?? returnStatusLabels.received}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const router = useRouter();
  const active = isActiveOrder(order);
  const delivered = currentStep(order) >= DELIVERED_STEP;
  const returns = returnEligibility(order);
  const count = order.lines.reduce((n, l) => n + l.qty, 0);

  const note = order.status === "cancelled"
    ? "Cancelled by the store."
    : !active
    ? "Not paid, so it won't be dispatched."
    : !delivered
      ? `Arrives ${order.deliveryEstimate} of ordering.`
      : returns.eligible
        ? `Exchange or refund open until ${formatDate(returns.closesAt)}.`
        : `Exchange window closed (${site.exchangeWindowDays} days after delivery).`;

  function buyAgain() {
    for (const l of order.lines) {
      const product = getProduct(l.slug);
      const price = currentUnitPrice({ slug: l.slug, option: l.option, qty: l.qty, price: l.unitPrice });
      if (!product || price === null) continue;
      addToCart({ slug: l.slug, name: l.name, type: product.type, tone: l.tone, price, qty: l.qty, colour: l.colour, option: l.option, size: l.size });
    }
    router.push("/cart");
  }

  return (
    <li className="flex flex-col gap-4 border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-medium">{order.id}</h2>
          <p className="text-sm text-muted">
            Placed {formatDate(order.createdAt)} · {order.payment === "cod" ? "Cash on delivery" : "Paid online"}
          </p>
        </div>
        <p className={`text-sm font-medium ${active ? "text-emerald" : "text-rust"}`}>{displayStatus(order)}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5" aria-hidden="true">
            {order.lines.slice(0, 4).map((l, i) => (
              <span key={i} style={{ backgroundColor: l.tone }} className="h-14 w-11" />
            ))}
          </div>
          <p className="text-[15px]">
            {count} {count === 1 ? "item" : "items"}
          </p>
        </div>
        <p className="font-medium">{formatPrice(order.total)}</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {active && !delivered && (
          <Link href={`/track?order=${order.id}`} className={btnSmall}>
            Track order
          </Link>
        )}
        {returns.eligible && (
          <Link href={`/returns?order=${order.id}`} className={btnSmall}>
            Exchange or refund
          </Link>
        )}
        <button type="button" onClick={buyAgain} className={btnSmall}>
          Buy again
        </button>
      </div>
      <p className="text-sm text-muted">{note}</p>
      <details className="border-t border-line pt-3 text-[15px]">
        <summary className="min-h-11 cursor-pointer content-center text-sm">Order details</summary>
        <ul className="mt-2 flex flex-col gap-2">
          {order.lines.map((l) => (
            <li key={[l.slug, l.colour, l.option, l.size].join("|")} className="flex justify-between gap-4">
              <span>
                {l.name}
                <span className="block text-sm text-muted">
                  {describeVariant(l)} · Qty {l.qty}
                </span>
              </span>
              <span className="shrink-0">{formatPrice(l.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">
          Delivery to {order.customer.city}: {formatPrice(order.shipping)} · {order.customer.name}, {order.customer.address}
        </p>
      </details>
    </li>
  );
}
