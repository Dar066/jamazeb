"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { searchProducts } from "@/lib/catalog";
import { useCatalog } from "./CatalogProvider";
import { ProductGrid } from "./ProductGrid";

const suggestions = ["Lawn", "Kurta", "Dupatta", "Unstitched", "Sage"];

/** Search box and results. Reads the query from the address, e.g. /search?q=lawn */
export function SearchResults() {
  const params = useSearchParams();
  const router = useRouter();
  const query = (params.get("q") ?? "").trim().slice(0, 80);
  const [draft, setDraft] = useState(query);
  const catalog = useCatalog();
  const results = query ? searchProducts(query, catalog) : [];

  return (
    <>
      <form
        role="search"
        action="/search"
        onSubmit={(e) => {
          e.preventDefault();
          const q = draft.trim();
          router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
        }}
        className="mb-8 flex flex-wrap gap-3"
      >
        <label htmlFor="search-q" className="sr-only">
          Search products
        </label>
        <input
          id="search-q"
          name="q"
          type="search"
          autoComplete="off"
          placeholder="Try lawn, kurta, dupatta"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="min-h-12 flex-[1_1_280px] border border-charcoal bg-white px-4 text-[15px]"
        />
        <button
          type="submit"
          className="min-h-12 cursor-pointer bg-charcoal px-7 text-sm tracking-[0.12em] text-ivory uppercase"
        >
          Search
        </button>
      </form>

      {!query && (
        <div className="flex flex-wrap items-center gap-2.5 text-sm">
          <span className="text-muted">Popular:</span>
          {suggestions.map((s) => (
            <Link
              key={s}
              href={`/search?q=${encodeURIComponent(s)}`}
              onClick={() => setDraft(s)}
              className="inline-flex min-h-10 items-center border border-line-strong bg-white px-4"
            >
              {s}
            </Link>
          ))}
        </div>
      )}

      {query && (
        <>
          <p aria-live="polite" className="mb-6 text-muted">
            {results.length === 0
              ? `No products match “${query}”.`
              : `${results.length} ${results.length === 1 ? "result" : "results"} for “${query}”`}
          </p>
          {results.length > 0 ? (
            <ProductGrid products={results} showFilters={results.length > 3} />
          ) : (
            <p>
              Try a different word, or{" "}
              <Link href="/collections/new-in" className="text-emerald underline">
                browse new arrivals
              </Link>
              .
            </p>
          )}
        </>
      )}
    </>
  );
}
