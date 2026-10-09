"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { describeVariant } from "@/lib/cart-pricing";
import { matchOrder, returnEligibility } from "@/lib/fulfilment";
import { formatDate, formatPrice } from "@/lib/format";
import { useHydrated } from "@/lib/local-store";
import { useOrders } from "@/lib/order-store";
import type { Order } from "@/lib/orders";
import { lookupOrder, syncLocalOrders } from "@/lib/order-sync";
import { saveReturn, useReturns } from "@/lib/return-store";
import {
  REFUND_METHODS,
  RETURN_LIMITS,
  RETURN_REASONS,
  needsRefundAccount,
  validateReturn,
  type ReturnErrors,
  type ReturnInput,
  type ReturnKind,
  type ReturnRequest,
} from "@/lib/returns";
import { site } from "@/lib/site";
import { normalizePkMobile } from "@/lib/validation";
import { openChat } from "./ChatWidget";
import { ChatIcon } from "./icons";
import { btnPrimary, btnSecondary, fieldBorder, fieldInput, fieldLabel, sectionTitle } from "./ui";

const lineKey = (l: Order["lines"][number]) => [l.slug, l.colour, l.option, l.size].join("|");

/** Find the order, check the 5-day window, then collect the request. */
export function ReturnForm() {
  const params = useSearchParams();
  const linked = params.get("order")?.toUpperCase() ?? "";
  const orders = useOrders();
  const hydrated = useHydrated();

  const [orderId, setOrderId] = useState(linked);
  const [phone, setPhone] = useState("");
  const [foundId, setFoundId] = useState<string | null>(null);
  const [findError, setFindError] = useState("");
  const [submitted, setSubmitted] = useState<ReturnRequest | null>(null);
  const [busy, setBusy] = useState(false);

  // Fetch the latest status of orders already on this device (e.g. marked delivered by the store).
  useEffect(() => {
    void syncLocalOrders();
  }, []);

  // Start fresh when the shopper comes back to this page after sending a request.
  useLayoutEffect(() => {
    return () => setSubmitted(null);
  }, []);

  const shownId = foundId ?? (linked && hydrated ? matchOrder(orders, linked, null)?.id : undefined);
  const order = shownId ? orders.find((o) => o.id === shownId) : undefined;

  async function handleFind(e: FormEvent) {
    e.preventDefault();
    const mobile = normalizePkMobile(phone);
    if (!/^JZ-?[0-9]{6}$/i.test(orderId.trim())) return setFindError("Enter your order number, like JZ-123456.");
    if (!mobile) return setFindError("Enter the mobile number you used at checkout, like 0300 1234567.");
    const id = orderId.trim().toUpperCase().replace(/^JZ-?/, "JZ-");
    setBusy(true);
    const fromServer = await lookupOrder(id, mobile);
    setBusy(false);
    const match = fromServer && fromServer !== "missing" ? fromServer : matchOrder(orders, id, mobile);
    if (!match) {
      setFoundId(null);
      return setFindError(
        "We couldn't find an order with that order number and mobile number. Check both, or message us on WhatsApp.",
      );
    }
    setFindError("");
    setFoundId(match.id);
  }

  if (submitted) return <Submitted request={submitted} onBack={() => setSubmitted(null)} />;

  return (
    <div className="flex flex-col gap-10">
      <form onSubmit={handleFind} noValidate aria-labelledby="find-title">
        <h2 id="find-title" className={sectionTitle}>
          1 · Find your order
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          <div>
            <label htmlFor="r-order" className={fieldLabel}>
              Order number
            </label>
            <input
              id="r-order"
              placeholder="JZ-123456"
              autoCapitalize="characters"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className={`${fieldInput} ${fieldBorder(findError)}`}
            />
          </div>
          <div>
            <label htmlFor="r-phone" className={fieldLabel}>
              Mobile number
            </label>
            <input
              id="r-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0300 1234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`${fieldInput} ${fieldBorder(findError)}`}
            />
          </div>
        </div>
        <div aria-live="polite">
          {findError && (
            <p role="alert" className="mt-3 text-sm text-rust">
              {findError}
            </p>
          )}
        </div>
        <button type="submit" disabled={busy} className={`${btnSecondary} mt-4`}>
          {busy ? "Looking up…" : "Find order"}
        </button>
      </form>

      {order && <OrderRequest key={order.id} order={order} onSubmitted={setSubmitted} />}
    </div>
  );
}

function OrderRequest({ order, onSubmitted }: { order: Order; onSubmitted: (r: ReturnRequest) => void }) {
  const eligibility = returnEligibility(order);
  const previous = useReturns().filter((r) => r.orderId === order.id);
  const formRef = useRef<HTMLFormElement>(null);

  const [picked, setPicked] = useState<string[]>(order.lines.map(lineKey));
  const [kind, setKind] = useState<ReturnKind>("exchange");
  const [exchangeFor, setExchangeFor] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [refundMethod, setRefundMethod] = useState("");
  const [accountTitle, setAccountTitle] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<ReturnErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const header = (
    <p className="text-[15px]">
      <span className="font-medium">{order.id}</span> · {order.payment === "cod" ? "Cash on delivery" : "Paid online"} ·{" "}
      {formatPrice(order.total)}
    </p>
  );

  if (!eligibility.eligible) {
    const message =
      eligibility.reason === "not-active"
        ? "This order wasn't paid, so there is nothing to exchange or refund."
        : eligibility.reason === "not-delivered"
          ? `This order hasn't been delivered yet. Requests open on delivery and stay open for ${site.exchangeWindowDays} days.`
          : `Order ${order.id} was delivered on ${formatDate(eligibility.deliveredAt!)}. Exchanges and refunds close ${site.exchangeWindowDays} days after delivery. For help, message us on WhatsApp.`;
    const title =
      eligibility.reason === "expired" ? `This order is past the ${site.exchangeWindowDays}-day window` : "Not open for requests yet";
    return (
      <section aria-labelledby="ineligible-title" className="flex flex-col gap-3 bg-rust-soft p-6">
        <h2 id="ineligible-title" className="font-medium">
          {title}
        </h2>
        {header}
        <p className="text-[15px]">{message}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          {eligibility.reason === "not-delivered" && (
            <Link href={`/track?order=${order.id}`} className={btnSecondary}>
              Track order
            </Link>
          )}
          <button type="button" onClick={() => openChat(`Hi, I need help with an exchange for order ${order.id}.`)} className={btnSecondary}>
            <ChatIcon size={20} /> Message us
          </button>
        </div>
      </section>
    );
  }

  const input: ReturnInput = {
    orderId: order.id,
    phone: order.customer.phone,
    payment: order.payment,
    items: order.lines
      .filter((l) => picked.includes(lineKey(l)))
      .map((l) => ({ slug: l.slug, name: l.name, variant: describeVariant(l), qty: l.qty })),
    kind,
    exchangeFor,
    reason,
    details,
    refundMethod,
    accountTitle,
    accountNumber,
    agreed,
  };
  const askAccount = needsRefundAccount(input);

  function clear(key: keyof ReturnErrors) {
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const found = validateReturn(input);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as { ok: true; request: ReturnRequest } | { ok: false; error: string; fieldErrors?: ReturnErrors };
      if (!data.ok) {
        setFormError(data.error);
        if (data.fieldErrors) setErrors(data.fieldErrors);
        setSubmitting(false);
        return;
      }
      saveReturn(data.request);
      onSubmitted(data.request);
      window.scrollTo({ top: 0 });
    } catch {
      setFormError("We couldn't reach the store. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  const err = (key: keyof ReturnErrors) =>
    errors[key] && (
      <p id={`${key}-error`} className="mt-1.5 text-sm text-rust">
        {errors[key]}
      </p>
    );
  const a11y = (key: keyof ReturnErrors) => ({
    "data-field": key,
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
  });

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-10">
      <div className="flex flex-col gap-1 bg-emerald-soft p-4 text-emerald">
        {header}
        <p className="text-sm">
          Delivered {formatDate(eligibility.deliveredAt)} · Eligible until {formatDate(eligibility.closesAt)} (
          {eligibility.daysLeft} {eligibility.daysLeft === 1 ? "day" : "days"} left)
        </p>
      </div>

      {previous.length > 0 && (
        <p className="border border-line-strong bg-white p-4 text-sm">
          You already sent {previous.length === 1 ? "a request" : `${previous.length} requests`} for this order (
          {previous.map((r) => r.id).join(", ")}). Send another only for different items.
        </p>
      )}

      <fieldset>
        <legend className={sectionTitle}>2 · Choose items</legend>
        <div className="flex flex-col gap-3">
          {order.lines.map((l, i) => {
            const key = lineKey(l);
            const checked = picked.includes(key);
            return (
              <label
                key={key}
                className={`flex cursor-pointer items-center gap-4 border bg-white p-4 ${checked ? "border-charcoal" : "border-line"}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  {...(i === 0 ? a11y("items") : {})}
                  onChange={() => {
                    setPicked((p) => (checked ? p.filter((k) => k !== key) : [...p, key]));
                    clear("items");
                  }}
                  className="h-5 w-5 shrink-0 accent-emerald"
                />
                <span aria-hidden="true" style={{ backgroundColor: l.tone }} className="h-16 w-12 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block">{l.name}</span>
                  <span className="block text-sm text-muted">
                    {describeVariant(l)} · Qty {l.qty}
                  </span>
                </span>
                <span className="shrink-0">{formatPrice(l.lineTotal)}</span>
              </label>
            );
          })}
        </div>
        {err("items")}
      </fieldset>

      <fieldset>
        <legend className={sectionTitle}>3 · Exchange or refund?</legend>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          {(
            [
              { value: "exchange", label: "Exchange", sub: "Swap for another size or colour." },
              { value: "refund", label: "Refund", sub: "Get your money back after we receive the item." },
            ] as const
          ).map((k) => (
            <label
              key={k.value}
              className={`flex cursor-pointer items-start gap-3 border bg-white p-4 ${kind === k.value ? "border-charcoal" : "border-line-strong"}`}
            >
              <input
                type="radio"
                name="kind"
                value={k.value}
                checked={kind === k.value}
                onChange={() => setKind(k.value)}
                className="mt-1 h-5 w-5 accent-emerald"
              />
              <span>
                <span className="block font-medium">{k.label}</span>
                <span className="block text-sm text-muted">{k.sub}</span>
              </span>
            </label>
          ))}
        </div>

        {kind === "exchange" && (
          <div className="mt-4">
            <label htmlFor="exchangeFor" className={fieldLabel}>
              What would you like instead?
            </label>
            <input
              id="exchangeFor"
              {...a11y("exchangeFor")}
              placeholder="e.g. size L, or the same suit in Rust"
              maxLength={RETURN_LIMITS.exchangeFor}
              value={exchangeFor}
              onChange={(e) => {
                setExchangeFor(e.target.value);
                clear("exchangeFor");
              }}
              className={`${fieldInput} ${fieldBorder(errors.exchangeFor)}`}
            />
            {err("exchangeFor")}
          </div>
        )}

        {kind === "refund" && order.payment === "payfast" && (
          <p className="mt-4 bg-sand p-4 text-[15px]">
            This order was paid online, so the refund goes back to the same card or wallet you paid with, within 5 working
            days of us receiving the item.
          </p>
        )}

        {askAccount && (
          <div className="mt-4 flex flex-col gap-4">
            <p className="text-[15px] text-muted">Cash-on-delivery orders are refunded to Easypaisa, JazzCash or a bank account.</p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
              <div>
                <label htmlFor="refundMethod" className={fieldLabel}>
                  Refund to
                </label>
                <select
                  id="refundMethod"
                  {...a11y("refundMethod")}
                  value={refundMethod}
                  onChange={(e) => {
                    setRefundMethod(e.target.value);
                    clear("refundMethod");
                    clear("accountNumber");
                  }}
                  className={`${fieldInput} ${fieldBorder(errors.refundMethod)}`}
                >
                  <option value="">Choose</option>
                  {REFUND_METHODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
                {err("refundMethod")}
              </div>
              <div>
                <label htmlFor="accountTitle" className={fieldLabel}>
                  Account holder&apos;s name
                </label>
                <input
                  id="accountTitle"
                  {...a11y("accountTitle")}
                  autoComplete="name"
                  maxLength={RETURN_LIMITS.accountTitle}
                  value={accountTitle}
                  onChange={(e) => {
                    setAccountTitle(e.target.value);
                    clear("accountTitle");
                  }}
                  className={`${fieldInput} ${fieldBorder(errors.accountTitle)}`}
                />
                {err("accountTitle")}
              </div>
            </div>
            <div>
              <label htmlFor="accountNumber" className={fieldLabel}>
                {refundMethod === "Bank account" ? "IBAN or account number" : "Mobile account number"}
              </label>
              <input
                id="accountNumber"
                {...a11y("accountNumber")}
                inputMode={refundMethod === "Bank account" ? "text" : "tel"}
                placeholder={refundMethod === "Bank account" ? "PK36SCBL0000001123456702" : "0300 1234567"}
                maxLength={RETURN_LIMITS.accountNumber + 6}
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value);
                  clear("accountNumber");
                }}
                className={`${fieldInput} ${fieldBorder(errors.accountNumber)}`}
              />
              {err("accountNumber")}
            </div>
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className={sectionTitle}>4 · Reason</legend>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="reason" className={fieldLabel}>
              Reason
            </label>
            <select
              id="reason"
              {...a11y("reason")}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                clear("reason");
              }}
              className={`${fieldInput} ${fieldBorder(errors.reason)}`}
            >
              <option value="">Choose a reason</option>
              {RETURN_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            {err("reason")}
          </div>
          <div>
            <label htmlFor="details" className={fieldLabel}>
              Details <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="details"
              {...a11y("details")}
              rows={3}
              maxLength={RETURN_LIMITS.details}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className={`${fieldInput} ${fieldBorder(errors.details)} py-3`}
            />
            {err("details")}
          </div>
          {(reason === "Damaged or faulty item" || reason === "Wrong item received") && (
            <p className="bg-sand p-4 text-[15px]">
              We&apos;ll ask for a photo of the item on WhatsApp when we confirm your request.
            </p>
          )}
          <label className="flex min-h-11 cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              {...a11y("agreed")}
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                clear("agreed");
              }}
              className="mt-0.5 h-5 w-5 shrink-0 accent-emerald"
            />
            The items are unused, unwashed and have their tags attached.
          </label>
          {err("agreed")}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3">
        <div aria-live="assertive">
          {formError && (
            <p role="alert" className="bg-rust-soft p-3 text-sm text-rust">
              {formError}
            </p>
          )}
        </div>
        <button type="submit" disabled={submitting} className={`${btnPrimary} self-start`}>
          {submitting ? "Sending…" : "Submit request"}
        </button>
      </div>
    </form>
  );
}

function Submitted({ request, onBack }: { request: ReturnRequest; onBack: () => void }) {
  const exchange = request.kind === "exchange";
  return (
    <div role="status" className="flex flex-col gap-6">
      <h2 className="font-serif text-[36px] leading-tight font-medium">Request received</h2>
      <p className="text-[15px]">
        Request number <span className="font-medium">{request.id}</span> · {exchange ? "Exchange" : "Refund"} for order{" "}
        {request.orderId}
      </p>
      <ol className="flex list-decimal flex-col gap-2 pl-5 text-[15px]">
        <li>We review your request and confirm on WhatsApp within 1 working day.</li>
        <li>Our courier collects the item from your address. Keep it unused, with tags attached.</li>
        <li>
          {exchange
            ? "Once we receive it, we dispatch your replacement within 15 days."
            : "Once we receive and check it, we send your refund within 5 working days."}
        </li>
      </ol>
      <div className="flex flex-wrap gap-3">
        <Link href="/account" className={btnPrimary}>
          View my account
        </Link>
        <button type="button" onClick={onBack} className={btnSecondary}>
          Back to form
        </button>
      </div>
    </div>
  );
}
