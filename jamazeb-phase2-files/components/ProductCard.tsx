import Link from "next/link";
import { isOnSale, type Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "./ProductImage";
import { WishlistButton } from "./WishlistButton";

export function ProductCard({ product }: { product: Product }) {
  const href = `/products/${product.slug}`;
  const onSale = isOnSale(product);
  const photo = product.images?.[0];

  return (
    <article className="flex flex-col gap-2.5">
      <div className="relative">
        {/* Duplicate of the name link below: hidden from screen readers and keyboard
            so each product is announced once. */}
        <Link href={href} aria-hidden="true" tabIndex={-1}>
          <ProductImage tone={product.tone} label={photo?.alt ?? product.name} src={photo?.src} className="h-[360px]" />
        </Link>
        {onSale && (
          <span className="absolute top-3 left-3 bg-emerald px-2.5 py-1 text-xs tracking-[0.1em] text-white uppercase">
            Sale
          </span>
        )}
        <WishlistButton productName={product.name} className="absolute top-2 right-2" />
      </div>
      <p className="text-[13px] tracking-[0.06em] text-muted uppercase">{product.type}</p>
      <h3 className="text-[17px] font-normal">
        <Link href={href}>{product.name}</Link>
      </h3>
      <p className="flex items-baseline gap-2.5">
        <span className="font-medium">{formatPrice(product.price)}</span>
        {onSale && (
          <span className="text-sm text-muted line-through">
            <span className="sr-only">Was </span>
            {formatPrice(product.compareAtPrice!)}
          </span>
        )}
      </p>
    </article>
  );
}
