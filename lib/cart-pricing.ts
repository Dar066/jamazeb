// Current price of a cart line, read from the catalogue. The cart saves the price
// seen when the item was added; if it has changed since, the cart and checkout
// show today's price, which is also what the server charges.

import { STITCHING_PRICE, getProduct, type Product } from "./catalog";

type Line = { slug: string; option: string; qty: number; price: number };

/** `catalog` = the live product list (useCatalog() in the browser). */
export function currentUnitPrice(line: Line, catalog?: Product[]): number | null {
  const product = getProduct(line.slug, catalog);
  if (!product || product.stock <= 0) return null;
  return product.price + (line.option === "Stitched" ? STITCHING_PRICE : 0);
}

/** "Sage · Stitched · Size M" */
export function describeVariant(line: { colour: string; option: string; size: string }): string {
  return [line.colour, line.option, line.size && `Size ${line.size}`].filter(Boolean).join(" · ");
}

export function cartTotals(lines: Line[], catalog?: Product[]) {
  let subtotal = 0;
  let count = 0;
  let unavailable = 0;
  for (const line of lines) {
    const price = currentUnitPrice(line, catalog);
    if (price === null) {
      unavailable++;
      continue;
    }
    subtotal += price * line.qty;
    count += line.qty;
  }
  return { subtotal, count, unavailable };
}
