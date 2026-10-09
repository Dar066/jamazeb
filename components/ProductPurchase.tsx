"use client";

import Link from "next/link";
import { useState } from "react";
import { addToCart, useCartCount } from "@/lib/cart-store";
import { STITCHED_SIZES, STITCHING_PRICE, isOnSale, type Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { MAX_QTY } from "@/lib/orders";
import { site } from "@/lib/site";
import { openChat } from "./ChatWidget";
import { ChatIcon } from "./icons";
import { WishlistButton } from "./WishlistButton";

const choice = (active: boolean) =>
  `min-h-11 cursor-pointer border border-charcoal px-4 text-sm ${active ? "bg-charcoal text-ivory" : "bg-transparent text-charcoal"}`;

/** Colour, stitching, size and quantity choices, plus Add to cart and Order on WhatsApp. */
export function ProductPurchase({ product }: { product: Product }) {
  const [colour, setColour] = useState(product.colours[0]?.name ?? "");
  const [stitched, setStitched] = useState(false);
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState<"idle" | "need-size" | "added">("idle");
  const cartCount = useCartCount();

  const sizes = product.sizes ?? (product.stitchable && stitched ? STITCHED_SIZES : undefined);
  const unitPrice = product.price + (product.stitchable && stitched ? STITCHING_PRICE : 0);
  const option = product.stitchable ? (stitched ? "Stitched" : "Unstitched") : "";
  const onSale = isOnSale(product);
  const lowStock = product.stock > 0 && product.stock <= 5;
  const soldOut = product.stock <= 0;

  const describe = () =>
    [colour && `colour ${colour}`, option && option.toLowerCase(), size && `size ${size}`, `quantity ${qty}`]
      .filter(Boolean)
      .join(", ");

  function handleAdd() {
    if (sizes && !size) {
      setStatus("need-size");
      return;
    }
    addToCart({
      slug: product.slug,
      name: product.name,
      type: product.type,
      tone: product.tone,
      price: unitPrice,
      qty,
      colour,
      option,
      size,
    });
    setStatus("added");
  }

  function handleWhatsApp() {
    if (sizes && !size) {
      setStatus("need-size");
      return;
    }
    openChat(
      `Hi, I'd like to order ${product.name} (${product.sku}): ${describe()}. Price ${formatPrice(unitPrice * qty)}. ${site.url}/products/${product.slug}`,
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-3">
        <p className="text-2xl font-medium">{formatPrice(unitPrice)}</p>
        {onSale && !stitched && (
          <p className="text-muted line-through">
            <span className="sr-only">Was </span>
            {formatPrice(product.compareAtPrice!)}
          </p>
        )}
        <p className="text-sm text-muted">Tax included</p>
      </div>

      {product.colours.length > 0 && (
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-sm tracking-[0.08em] uppercase">
            Colour: <span className="text-muted">{colour}</span>
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {product.colours.map((c) => {
              const active = c.name === colour;
              return (
                <button
                  key={c.name}
                  type="button"
                  aria-label={c.name}
                  aria-pressed={active}
                  onClick={() => setColour(c.name)}
                  style={{ backgroundColor: c.hex }}
                  className={`h-11 w-11 cursor-pointer rounded-full ${
                    active ? "ring-2 ring-charcoal ring-offset-2 ring-offset-ivory" : "ring-1 ring-black/15 ring-inset"
                  }`}
                />
              );
            })}
          </div>
        </fieldset>
      )}

      {product.stitchable && (
        <fieldset>
          <legend className="mb-2.5 text-sm tracking-[0.08em] uppercase">Type</legend>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" aria-pressed={!stitched} onClick={() => { setStitched(false); setSize(""); }} className={choice(!stitched)}>
              Unstitched
            </button>
            <button type="button" aria-pressed={stitched} onClick={() => setStitched(true)} className={choice(stitched)}>
              Stitched (+ {formatPrice(STITCHING_PRICE)})
            </button>
          </div>
        </fieldset>
      )}

      {sizes && (
        <fieldset>
          <legend className="mb-2.5 text-sm tracking-[0.08em] uppercase">
            Size: <span className="text-muted">{size || "choose one"}</span>
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={s === size}
                onClick={() => {
                  setSize(s);
                  if (status === "need-size") setStatus("idle");
                }}
                className={`${choice(s === size)} min-w-[52px]`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">See the size guide below for measurements.</p>
        </fieldset>
      )}

      {lowStock && <p className="text-sm font-medium text-rust">Only {product.stock} left</p>}

      <div className="flex flex-wrap items-stretch gap-3">
        <div className="flex items-center border border-line-strong bg-white">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="h-[52px] w-11 cursor-pointer text-xl"
          >
            −
          </button>
          <span aria-live="polite" aria-label={`Quantity ${qty}`} className="min-w-8 text-center">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
            className="h-[52px] w-11 cursor-pointer text-xl"
          >
            +
          </button>
        </div>
        <button
          type="button"
          disabled={soldOut}
          onClick={handleAdd}
          className="min-h-[52px] flex-[1_1_200px] cursor-pointer bg-emerald text-sm tracking-[0.12em] text-white uppercase disabled:cursor-not-allowed disabled:bg-muted"
        >
          {soldOut ? "Sold out" : "Add to cart"}
        </button>
        <WishlistButton slug={product.slug} productName={product.name} className="h-[52px]! w-[52px]! border border-charcoal" />
      </div>

      <div aria-live="polite">
        {status === "need-size" && (
          <p role="alert" className="text-sm text-rust">
            Please choose a size first.
          </p>
        )}
        {status === "added" && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-soft px-4 py-3 text-emerald">
            <p>Added to cart. You have {cartCount} {cartCount === 1 ? "item" : "items"} in your cart.</p>
            <Link href="/cart" className="text-sm tracking-[0.1em] uppercase underline">
              View cart
            </Link>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleWhatsApp}
        className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2.5 border border-charcoal text-sm tracking-[0.12em] text-charcoal uppercase"
      >
        <ChatIcon size={20} />
        Order on WhatsApp
      </button>

      <p className="bg-sand p-4 text-[15px]">Cash on delivery or pay online with card, Easypaisa or JazzCash.</p>
    </div>
  );
}
