"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import type { PaymentOutcome } from "@/lib/payments/types";

/**
 * Stand-in for PayFast's hosted payment page. The shopper picks what happens;
 * the server signs the result and sends them back to the store to be verified.
 */
export function MockGateway() {
  const params = useSearchParams();
  // A new payment link starts with fresh state.
  return (
    <Gateway
      key={params.toString()}
      order={params.get("order") ?? ""}
      amount={Number(params.get("amount"))}
      sig={params.get("sig") ?? ""}
    />
  );
}

function Gateway({ order, amount, sig }: { order: string; amount: number; sig: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<PaymentOutcome | null>(null);
  const [error, setError] = useState("");

  // Reset when the page is left, so returning to it (e.g. to retry) shows usable buttons.
  useLayoutEffect(() => {
    return () => {
      setBusy(null);
      setError("");
    };
  }, []);

  const looksValid = /^JZ-[0-9]{6}$/.test(order) && Number.isInteger(amount) && amount > 0 && sig.length > 0;

  async function finish(outcome: PaymentOutcome) {
    setBusy(outcome);
    setError("");
    try {
      const res = await fetch("/api/payments/mock/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order, amount, sig, outcome }),
      });
      const data = (await res.json()) as { ok: boolean; returnUrl?: string; error?: string };
      if (data.ok && data.returnUrl) {
        router.replace(data.returnUrl);
        return;
      }
      setError(data.error ?? "Something went wrong.");
    } catch {
      setError("Couldn't reach the payment service. Please try again.");
    }
    setBusy(null);
  }

  if (!looksValid) {
    return (
      <p role="alert" className="bg-rust-soft p-4 text-rust">
        This payment link is incomplete. Please go back to checkout and try again.
      </p>
    );
  }

  const action = "min-h-[52px] cursor-pointer px-6 text-sm tracking-[0.12em] uppercase disabled:cursor-wait disabled:opacity-70";

  return (
    <div className="flex flex-col gap-6">
      <dl className="flex flex-col gap-3 border border-line-strong bg-white p-6 text-[15px]">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Merchant</dt>
          <dd>Jamazeb</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Order number</dt>
          <dd>{order}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-line pt-3 text-lg font-medium">
          <dt>Amount</dt>
          <dd>{formatPrice(amount)}</dd>
        </div>
      </dl>

      <div aria-live="assertive">
        {error && (
          <p role="alert" className="bg-rust-soft p-3 text-sm text-rust">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <button type="button" disabled={busy !== null} onClick={() => finish("paid")} className={`${action} bg-emerald text-white`}>
          {busy === "paid" ? "Processing…" : "Approve payment"}
        </button>
        <button type="button" disabled={busy !== null} onClick={() => finish("failed")} className={`${action} border border-charcoal text-charcoal`}>
          {busy === "failed" ? "Processing…" : "Decline payment"}
        </button>
        <button type="button" disabled={busy !== null} onClick={() => finish("cancelled")} className={`${action} text-muted underline underline-offset-4`}>
          Cancel and return to store
        </button>
      </div>
    </div>
  );
}
