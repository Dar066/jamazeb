"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";

type Sort = "new" | "price-asc" | "price-desc";

const sortLabels: Record<Sort, string> = {
  new: "Newest first",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

/** Product grid with fabric filter and sorting. Runs in the browser, so pages stay static and fast. */
export function ProductGrid({ products, showFilters = true }: { products: Product[]; showFilters?: boolean }) {
  const [fabric, setFabric] = useState("All");
  const [sort, setSort] = useState<Sort>("new");

  const fabrics = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.fabric))).sort()], [products]);

  const shown = useMemo(() => {
    const list = fabric === "All" ? products : products.filter((p) => p.fabric === fabric);
    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else sorted.sort((a, b) => a.newness - b.newness);
    return sorted;
  }, [products, fabric, sort]);

  return (
    <>
      {/* Keeps headings in order (h1 page title > h2 > h3 product names) for screen readers. */}
      <h2 className="sr-only">Products</h2>
      {showFilters && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
          {fabrics.length > 2 ? (
            <div role="group" aria-label="Filter by fabric" className="flex flex-wrap gap-2.5">
              {fabrics.map((f) => {
                const active = f === fabric;
                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFabric(f)}
                    className={`min-h-10 cursor-pointer border border-charcoal px-4 text-sm ${
                      active ? "bg-charcoal text-ivory" : "bg-transparent text-charcoal"
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3 text-sm">
            <p aria-live="polite" className="text-muted">
              {shown.length} {shown.length === 1 ? "product" : "products"}
            </p>
            <label htmlFor="sort" className="sr-only">
              Sort by
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="min-h-11 border border-line-strong bg-white px-3 text-sm text-charcoal"
            >
              {(Object.keys(sortLabels) as Sort[]).map((s) => (
                <option key={s} value={s}>
                  {sortLabels[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {shown.length === 0 ? (
        <p className="py-16 text-center text-muted">No products match this filter yet.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-5 gap-y-8">
          {shown.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </>
  );
}
