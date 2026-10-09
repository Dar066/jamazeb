import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "@/components/SearchResults";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Jamazeb for lawn suits, kurtas, dupattas and more.",
  alternates: { canonical: "/search" },
  // Search result pages should not appear in Google, but their links can be followed.
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-10 pb-[88px]">
      <h1 className="mb-6 font-serif text-[44px] leading-tight font-medium sm:text-[52px]">Search</h1>
      {/* Results load in the browser; reserving space stops the footer jumping when they appear. */}
      <div className="min-h-[70vh]">
        <Suspense fallback={<div className="mb-8 min-h-12 border border-line bg-white" />}>
          <SearchResults />
        </Suspense>
      </div>
    </div>
  );
}
