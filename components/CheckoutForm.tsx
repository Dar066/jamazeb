"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { cartTotals, currentUnitPrice, describeVariant } from "@/lib/cart-pricing";
import { clearCart, useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { useHydrated } from "@/lib/local-store";
import { saveOrder } from "@/lib/order-store";
import { getProfile, saveAddress, saveProfile } from "@/lib/profile-store";
import type { CheckoutRequest, CheckoutResponse, PaymentMethod } from "@/lib/orders";
import { shipping } from "@/lib/shipping";
import { LIMITS, validateCustomer, type CustomerErrors, type CustomerInput } from "@/lib/validation";
import { useCatalog } from "./CatalogProvider";

const FIELD_ORDER: (keyof CustomerInput)[] = ["phone", "email", "name", "city", "address", "notes"];

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; sub: string }[] = [
  { value: "cod", label: "Cash on delivery", sub: "Pay the rider in cash when your parcel arrives." },
  { value: "payfast", label: "Pay online with PayFast", sub: "Debit or credit card, Easypaisa, JazzCash or bank account." },
];

const input =
  "min-h-12 w-full border bg-white px-3.5 text-base text-charcoal placeholder:text-muted-dark focus:outline-2 focus:outline-offset-0 focus:outline-charcoal";
const label = "mb-1.5 block text-sm font-medium";
const sectionTitle = "mb-4 text-sm tracking-[0.12em] uppercase";

export function CheckoutForm() {
  const router = useRouter();
  const items = useCart();
  const hydrated = useHydrated();
  const catalog = useCatalog();
  const formRef = useRef<HTMLFormElement>(null);

  // Filled in from the details saved on this device, if any (see Account > Profile).
  const [customer, setCustomer] = useState<CustomerInput>(() => {
    const profile = getProfile();
    const home = profile.addresses[0];
    return {
      phone: profile.phone,
      email: profile.email,
      name: home?.name || profile.name,
      city: home?.city ?? "",
      address: home?.address ?? "",
      notes: home?.notes ?? "",
      whatsappUpdates: profile.whatsappUpdates,
    };
  });
  const [remember, setRemember] = useState(true);
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [formError, setFormError] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "done">("idle");

  // Next.js keeps visited pages alive in the background. When the shopper leaves
  // (e.g. to the payment page) and comes back, show the form again rather than
  // "Placing your order…". Their typed details are kept.
  useLayoutEffect(() => {
    return () => {
      setState("idle");
      setFormError("");
    };
  }, []);

  if (!hydrated) return <div aria-busy="true" className="min-h-[70vh]" />;

  if (state === "done") {
    return (
      <p role="status" className="min-h-[50vh] text-lg">
        Placing your order…
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-start gap-6">
        <p className="text-lg">Your cart is empty, so there is nothing to check out yet.</p>
        <Link href="/collections/new-in" className="flex min-h-[52px] items-center bg-emerald px-6 text-sm tracking-[0.12em] text-white uppercase">
          Continue shopping
        </Link>
      </div>
    );
  }

  const { subtotal, unavailable } = cartTotals(items, catalog);
  const delivery = customer.city ? shipping.getRate(customer.city) : null;
  const total = subtotal + (delivery ?? 0);
  const submitting = state === "submitting";

  function update<K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) {
    setCustomer((c) => ({ ...c, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function focusFirstError(found: CustomerErrors) {
    const first = FIELD_ORDER.find((f) => found[f]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const found = validateCustomer(customer, shipping.cities);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirstError(found);
      return;
    }
    if (unavailable > 0) {
      setFormError("Some items in your cart are no longer available. Please remove them from your cart.");
      return;
    }

    setState("submitting");
    const request: CheckoutRequest = {
      customer,
      payment,
      items: items.map(({ slug, colour, option, size, qty }) => ({ slug, colour, option, size, qty })),
    };

    let data: CheckoutResponse;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      data = (await res.json()) as CheckoutResponse;
    } catch {
      setState("idle");
      setFormError("We couldn't reach the store. Check your connection and try again.");
      return;
    }

    if (!data.ok) {
      setState("idle");
      setFormError(data.error);
      if (data.fieldErrors) {
        setErrors(data.fieldErrors);
        focusFirstError(data.fieldErrors);
      }
      return;
    }

    saveOrder({ ...data.order, paymentUrl: data.redirectUrl });
    if (remember) rememberDetails(data.order.customer);
    setState("done");
    if (data.redirectUrl) {
      // The cart is kept until the payment succeeds.
      router.push(data.redirectUrl);
    } else {
      clearCart();
      router.replace(`/checkout/complete?order=${data.order.id}`);
    }
  }

  const field = (name: keyof CustomerInput) => ({
    id: name,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
    className: `${input} ${errors[name] ? "border-rust" : "border-line-strong"}`,
  });

  const errorText = (name: keyof CustomerInput) =>
    errors[name] && (
      <p id={`${name}-error`} className="mt-1.5 text-sm text-rust">
        {errors[name]}
      </p>
    );

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-wrap items-start gap-12">
      <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-10">
        <fieldset>
          <legend className={sectionTitle}>1 · Contact</legend>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
            <div>
              <label htmlFor="phone" className={label}>
                Mobile number
              </label>
              <input
                {...field("phone")}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0300 1234567"
                value={customer.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
              {errorText("phone")}
            </div>
            <div>
              <label htmlFor="email" className={label}>
                Email <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                {...field("email")}
                type="email"
                autoComplete="email"
                maxLength={LIMITS.email}
                value={customer.email}
                onChange={(e) => update("email", e.target.value)}
              />
              {errorText("email")}
            </div>
          </div>
          <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={customer.whatsappUpdates}
              onChange={(e) => update("whatsappUpdates", e.target.checked)}
              className="h-5 w-5 accent-emerald"
            />
            Send order updates on WhatsApp
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-5 w-5 accent-emerald"
            />
            Save my details on this device for next time
          </label>
        </fieldset>

        <fieldset>
          <legend className={sectionTitle}>2 · Delivery address</legend>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
            <div>
              <label htmlFor="name" className={label}>
                Full name
              </label>
              <input
                {...field("name")}
                type="text"
                autoComplete="name"
                maxLength={LIMITS.name}
                value={customer.name}
                onChange={(e) => update("name", e.target.value)}
              />
              {errorText("name")}
            </div>
            <div>
              <label htmlFor="city" className={label}>
                City
              </label>
              <select {...field("city")} value={customer.city} onChange={(e) => update("city", e.target.value)}>
                <option value="">Choose city</option>
                {shipping.cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errorText("city")}
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="address" className={label}>
              Address
            </label>
            <input
              {...field("address")}
              type="text"
              autoComplete="street-address"
              placeholder="House, street, area"
              maxLength={LIMITS.address}
              value={customer.address}
              onChange={(e) => update("address", e.target.value)}
            />
            {errorText("address")}
          </div>
          <div className="mt-4">
            <label htmlFor="notes" className={label}>
              Landmark or note for rider <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              {...field("notes")}
              type="text"
              maxLength={LIMITS.notes}
              value={customer.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
            {errorText("notes")}
          </div>
        </fieldset>

        <section aria-labelledby="delivery-title">
          <h2 id="delivery-title" className={sectionTitle}>
            3 · Delivery
          </h2>
          <div className="flex items-center justify-between gap-4 border border-line-strong bg-white p-4">
            <div>
              <p className="font-medium">Standard courier delivery</p>
              <p className="text-sm text-muted">
                {customer.city ? `To ${customer.city}` : "Choose your city"} · {shipping.getEstimate(customer.city)}
              </p>
            </div>
            <p className="font-medium">{delivery === null ? "–" : formatPrice(delivery)}</p>
          </div>
        </section>

        <fieldset>
          <legend className={sectionTitle}>4 · Payment</legend>
          <div className="flex flex-col gap-3">
            {PAYMENT_OPTIONS.map((p) => (
              <label
                key={p.value}
                className={`flex cursor-pointer items-start gap-3 border bg-white p-4 ${payment === p.value ? "border-charcoal" : "border-line-strong"}`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={p.value}
                  checked={payment === p.value}
                  onChange={() => setPayment(p.value)}
                  className="mt-1 h-5 w-5 accent-emerald"
                />
                <span>
                  <span className="block font-medium">{p.label}</span>
                  <span className="block text-sm text-muted">{p.sub}</span>
                </span>
              </label>
            ))}
          </div>
          {payment === "payfast" && (
            <p className="mt-3 bg-rust-soft p-4 text-sm">
              Demo mode: you will go to a test payment page to approve or decline the payment. No real money is charged.
            </p>
          )}
        </fieldset>
      </div>

      <aside aria-labelledby="summary-title" className="flex flex-[1_1_320px] flex-col gap-4 bg-sand p-6 lg:sticky lg:top-6">
        <h2 id="summary-title" className="font-serif text-[28px] font-medium">
          Order summary
        </h2>
        <ul className="flex flex-col gap-4">
          {items.map((item) => {
            const price = currentUnitPrice(item, catalog);
            return (
              <li key={item.key} className="flex justify-between gap-4 text-[15px]">
                <div className="min-w-0">
                  <p>{item.name}</p>
                  <p className="text-sm text-muted">
                    {describeVariant(item)} · Qty {item.qty}
                  </p>
                  {price === null && <p className="text-sm text-rust">No longer available</p>}
                </div>
                <p className="shrink-0">{price === null ? "–" : formatPrice(price * item.qty)}</p>
              </li>
            );
          })}
        </ul>
        <dl className="flex flex-col gap-3 border-t border-line-strong pt-4 text-[15px]">
          <div className="flex justify-between gap-4">
            <dt>Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Delivery{customer.city && ` (${customer.city})`}</dt>
            <dd>{delivery === null ? <span className="text-muted">Choose city</span> : formatPrice(delivery)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line-strong pt-3 text-lg font-medium">
            <dt>Total</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>
        <div aria-live="assertive">
          {formError && (
            <p role="alert" className="bg-rust-soft p-3 text-sm text-rust">
              {formError}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="min-h-[52px] cursor-pointer bg-emerald px-6 text-sm tracking-[0.12em] text-white uppercase disabled:cursor-wait disabled:opacity-70"
        >
          {submitting ? "Please wait…" : payment === "cod" ? "Place order" : `Pay ${formatPrice(total)}`}
        </button>
        <Link href="/cart" className="text-center text-sm underline underline-offset-4">
          Back to cart
        </Link>
      </aside>
    </form>
  );
}

/** Saves contact details and the delivery address to Account > Profile / Saved addresses. */
function rememberDetails(c: CustomerInput) {
  const profile = getProfile();
  saveProfile({ name: profile.name || c.name, phone: c.phone, email: c.email, whatsappUpdates: c.whatsappUpdates });
  const known = profile.addresses.some((a) => a.city === c.city && a.address.toLowerCase() === c.address.toLowerCase());
  if (!known) {
    saveAddress({ label: profile.addresses.length === 0 ? "Home" : "Address", name: c.name, city: c.city, address: c.address, notes: c.notes });
  }
}
