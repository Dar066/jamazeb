"use client";

import Link from "next/link";
import { cartTotals, currentUnitPrice, describeVariant } from "@/lib/cart-pricing";
import { removeFromCart, setQuantity, useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { useHydrated } from "@/lib/local-store";
import { ProductImage } from "./ProductImage";
import { QuantityStepper } from "./QuantityStepper";

const button =
  "flex min-h-[52px] items-center justify-center px-6 text-sm tracking-[0.12em] uppercase";

export function CartView() {
  const items = useCart();
  const hydrated = useHydrated();

  // The cart lives in the browser, so the server renders a placeholder of similar size.
  if (!hydrated) return <div aria-busy="true" className="min-h-[50vh]" />;

  if (items.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-start gap-6">
        <p className="text-lg">Your cart is empty.</p>
        <Link href="/collections/new-in" className={`${button} bg-emerald text-white`}>
          Continue shopping
        </Link>
      </div>
    );
  }

  const { subtotal, count, unavailable } = cartTotals(items);

  return (
    <div className="flex flex-wrap items-start gap-12">
      <section aria-label="Items in your cart" className="min-w-0 flex-[1_1_560px]">
        <ul className="border-t border-line">
          {items.map((item) => {
            const price = currentUnitPrice(item);
            const href = `/products/${item.slug}`;
            return (
              <li key={item.key} className="flex gap-4 border-b border-line py-6 sm:gap-6">
                <Link href={href} aria-hidden="true" tabIndex={-1} className="shrink-0">
                  <ProductImage tone={item.tone} label={item.name} sizes="96px" className="h-32 w-24 !p-2 [&>span]:hidden" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <p className="text-[13px] tracking-[0.06em] text-muted uppercase">{item.type}</p>
                  <h2 className="text-[17px] font-normal">
                    <Link href={href}>{item.name}</Link>
                  </h2>
                  <p className="text-sm text-muted">{describeVariant(item)}</p>
                  {price === null ? (
                    <p className="text-sm text-rust">No longer available. Please remove it to continue.</p>
                  ) : (
                    <p className="text-sm text-muted">{formatPrice(price)} each</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    {price !== null && (
                      <QuantityStepper value={item.qty} label={item.name} onChange={(q) => setQuantity(item.key, q)} />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.key)}
                      aria-label={`Remove ${item.name} from cart`}
                      className="min-h-11 cursor-pointer text-sm text-muted underline underline-offset-4 hover:text-charcoal"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="shrink-0 font-medium">{price === null ? "–" : formatPrice(price * item.qty)}</p>
              </li>
            );
          })}
        </ul>
        <Link href="/collections/new-in" className="mt-6 inline-flex min-h-11 items-center text-sm tracking-[0.1em] uppercase underline underline-offset-4">
          Continue shopping
        </Link>
      </section>

      <aside aria-labelledby="summary-title" className="flex flex-[1_1_320px] flex-col gap-4 bg-sand p-6 lg:sticky lg:top-6">
        <h2 id="summary-title" className="font-serif text-[28px] font-medium">
          Order summary
        </h2>
        <dl className="flex flex-col gap-3 text-[15px]">
          <div className="flex justify-between gap-4">
            <dt>
              Subtotal ({count} {count === 1 ? "item" : "items"})
            </dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Delivery</dt>
            <dd className="text-muted">Calculated at checkout</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line-strong pt-3 text-lg font-medium">
            <dt>Total</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
        </dl>
        {unavailable > 0 ? (
          <p role="alert" className="text-sm text-rust">
            Remove unavailable items to continue.
          </p>
        ) : (
          <Link href="/checkout" className={`${button} bg-emerald text-white`}>
            Proceed to checkout
          </Link>
        )}
        <p className="text-sm text-muted">Pay cash on delivery, or online with card, Easypaisa or JazzCash.</p>
      </aside>
    </div>
  );
}
