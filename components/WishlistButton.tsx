"use client";

import { useState } from "react";
import { HeartIcon } from "./icons";

/** Toggles a product in the wishlist. Saved per visitor in a later phase. */
export function WishlistButton({ productName, className = "" }: { productName: string; className?: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
      onClick={() => setSaved((v) => !v)}
      className={`flex h-11 w-11 cursor-pointer items-center justify-center bg-ivory text-charcoal ${className}`}
    >
      <HeartIcon size={18} filled={saved} />
    </button>
  );
}
