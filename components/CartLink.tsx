"use client";

import Link from "next/link";
import { useCartCount } from "@/lib/cart-store";
import { BagIcon } from "./icons";

export function CartLink() {
  const count = useCartCount();
  return (
    <Link
      href="/cart"
      aria-label={count ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart, empty"}
      className="flex h-11 items-center gap-1.5 px-2.5 text-sm text-charcoal"
    >
      <BagIcon />
      <span>Cart</span>
      {count > 0 && (
        <span aria-hidden="true" className="min-w-5 bg-emerald px-1.5 text-center text-xs leading-5 text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
