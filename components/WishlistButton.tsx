"use client";

import { toggleWishlist, useWishlist } from "@/lib/wishlist-store";
import { HeartIcon } from "./icons";

/** Adds or removes a product from the wishlist, saved in the visitor's browser. */
export function WishlistButton({
  slug,
  productName,
  className = "",
}: {
  slug: string;
  productName: string;
  className?: string;
}) {
  const saved = useWishlist().includes(slug);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
      onClick={() => toggleWishlist(slug)}
      className={`flex h-11 w-11 cursor-pointer items-center justify-center bg-ivory text-charcoal ${className}`}
    >
      <HeartIcon size={18} filled={saved} />
    </button>
  );
}
