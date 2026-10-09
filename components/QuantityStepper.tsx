"use client";

import { MAX_QTY } from "@/lib/orders";

/** − 1 + control. `label` names the item for screen readers. */
export function QuantityStepper({
  value,
  onChange,
  label,
  size = "md",
}: {
  value: number;
  onChange: (qty: number) => void;
  label: string;
  size?: "md" | "lg";
}) {
  const h = size === "lg" ? "h-[52px]" : "h-11";
  return (
    <div className="flex w-fit items-center border border-line-strong bg-white">
      <button
        type="button"
        aria-label={`Decrease quantity of ${label}`}
        disabled={value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
        className={`${h} w-11 cursor-pointer text-xl disabled:cursor-not-allowed disabled:text-muted-dark`}
      >
        −
      </button>
      <span aria-live="polite" aria-label={`Quantity ${value}`} className="min-w-8 text-center">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Increase quantity of ${label}`}
        disabled={value >= MAX_QTY}
        onClick={() => onChange(Math.min(MAX_QTY, value + 1))}
        className={`${h} w-11 cursor-pointer text-xl disabled:cursor-not-allowed disabled:text-muted-dark`}
      >
        +
      </button>
    </div>
  );
}
