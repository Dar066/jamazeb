"use client";

import { createContext, useContext } from "react";
import { products as builtIn, type Product } from "@/lib/catalog";

// The live product list, handed down from the server (root layout) so that
// browser-side features (cart prices, search, wishlist, buy again) use the same
// prices and stock as the pages.
const CatalogContext = createContext<Product[]>(builtIn);

export function CatalogProvider({ products, children }: { products: Product[]; children: React.ReactNode }) {
  return <CatalogContext value={products}>{children}</CatalogContext>;
}

export function useCatalog(): Product[] {
  return useContext(CatalogContext);
}
