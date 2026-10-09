"use client";

import Link from "next/link";
import { getProduct, type Product } from "@/lib/catalog";
import { useHydrated } from "@/lib/local-store";
import { useWishlist } from "@/lib/wishlist-store";
import { ProductCard } from "./ProductCard";

export function WishlistView() {
  const slugs = useWishlist();
  const hydrated = useHydrated();

  if (!hydrated) return <div aria-busy="true" className="min-h-[50vh]" />;

  const products = slugs.map(getProduct).filter((p): p is Product => Boolean(p));

  if (products.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-start gap-6">
        <p className="text-lg">You haven&apos;t saved anything yet. Tap the heart on any product to keep it here.</p>
        <Link href="/collections/new-in" className="flex min-h-[52px] items-center bg-emerald px-6 text-sm tracking-[0.12em] text-white uppercase">
          Browse new arrivals
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mb-6 text-muted" aria-live="polite">
        {products.length} saved {products.length === 1 ? "item" : "items"}
      </p>
      <h2 className="sr-only">Saved products</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-5 gap-y-8">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </>
  );
}
