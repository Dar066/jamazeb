"use client";

import { useState } from "react";
import type { Product } from "@/lib/catalog";
import { ProductImage } from "./ProductImage";

/** Main image with clickable thumbnails. Shows a single placeholder until photos are added. */
export function ProductGallery({ product }: { product: Product }) {
  const images = product.images ?? [];
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="flex flex-col gap-3">
      <ProductImage
        tone={product.tone}
        label={current?.alt ?? product.name}
        src={current?.src}
        sizes="(max-width: 1024px) 100vw, 50vw"
        priority
        className="h-[480px] sm:h-[680px]"
      />
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              aria-label={`Show image ${i + 1}: ${img.alt}`}
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className={`cursor-pointer p-0 ${i === active ? "outline-2 outline-charcoal" : "outline-1 outline-line"}`}
            >
              <ProductImage tone={product.tone} label="" src={img.src} sizes="120px" className="h-[120px]" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
