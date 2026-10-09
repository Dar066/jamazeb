import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductCard } from "@/components/ProductCard";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductPurchase } from "@/components/ProductPurchase";
import { getCategory, getProduct, getRelatedProducts, products, sizeChart } from "@/lib/catalog";
import { jsonLd } from "@/lib/jsonld";
import { site } from "@/lib/site";

// Every product page is built ahead of time as a static page.
// "navigation" means the whole page is produced before anything is sent, so an
// unknown address returns a real 404 status instead of a 200 "not found" page.
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  const path = `/products/${product.slug}`;
  const image = product.images?.[0];
  return {
    title: product.name,
    description: `${product.description} ${product.type}, Rs ${product.price.toLocaleString("en-US")}. Cash on delivery across Pakistan.`,
    alternates: { canonical: path },
    openGraph: {
      url: path,
      title: `${product.name} | ${site.name}`,
      description: product.description,
      ...(image ? { images: [{ url: image.src, alt: image.alt }] } : {}),
    },
  };
}

const sectionClass = "group border-b border-line";
const summaryClass =
  "flex min-h-14 cursor-pointer list-none items-center justify-between text-sm tracking-[0.1em] uppercase [&::-webkit-details-marker]:hidden";

function Sign() {
  return (
    <span aria-hidden="true" className="text-xl">
      <span className="group-open:hidden">+</span>
      <span className="hidden group-open:inline">−</span>
    </span>
  );
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  // Breadcrumb goes through the product's most specific collection.
  const primary = getCategory(product.categories.find((c) => c !== "new-in" && c !== "sale") ?? product.categories[0])!;
  const related = getRelatedProducts(product, 4);
  const hasSizes = Boolean(product.sizes || product.stitchable);
  const url = `${site.url}/products/${product.slug}`;

  // Product structured data: lets Google show price and stock in search results.
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: site.name },
    category: product.type,
    material: product.fabric,
    color: product.colours.map((c) => c.name).join(", "),
    url,
    ...(product.images?.length ? { image: product.images.map((i) => `${site.url}${i.src}`) } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "PKR",
      price: product.price,
      itemCondition: "https://schema.org/NewCondition",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: site.name },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "PK",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: site.exchangeWindowDays,
        returnMethod: "https://schema.org/ReturnByMail",
      },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      <div className="mx-auto max-w-[1280px] px-6 pt-5">
        <Breadcrumbs
          items={[
            { label: primary.name, href: `/collections/${primary.slug}` },
            { label: product.name, href: `/products/${product.slug}` },
          ]}
        />
      </div>

      <section className="mx-auto flex max-w-[1280px] flex-wrap items-start gap-14 px-6 pt-4 pb-20">
        <div className="min-w-0 flex-[1_1_520px]">
          <ProductGallery product={product} />
        </div>

        <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-[13px] tracking-[0.08em] text-muted uppercase">
              {product.type} · SKU {product.sku}
            </p>
            <h1 className="font-serif text-[40px] leading-[1.1] font-medium sm:text-[44px]">{product.name}</h1>
          </div>

          <ProductPurchase product={product} />

          <div className="border-t border-line">
            <details className={sectionClass} open>
              <summary className={summaryClass}>
                Description <Sign />
              </summary>
              <p className="pb-5 text-[15px] text-muted">{product.description}</p>
            </details>
            <details className={sectionClass}>
              <summary className={summaryClass}>
                Fabric details <Sign />
              </summary>
              <ul className="pb-5 text-[15px] text-muted">
                {product.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </details>
            {hasSizes && (
              <details className={sectionClass}>
                <summary className={summaryClass}>
                  Size guide <Sign />
                </summary>
                <div className="pb-5">
                  <table className="w-full max-w-sm text-left text-[15px]">
                    <caption className="pb-2 text-left text-sm text-muted">Garment measurements in inches</caption>
                    <thead>
                      <tr className="border-b border-line text-muted">
                        <th scope="col" className="py-1.5 font-medium">Size</th>
                        <th scope="col" className="py-1.5 font-medium">Chest</th>
                        <th scope="col" className="py-1.5 font-medium">Shirt length</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizeChart.map((r) => (
                        <tr key={r.size} className="border-b border-[#efece4]">
                          <th scope="row" className="py-1.5 font-normal">{r.size}</th>
                          <td className="py-1.5">{r.chest}</td>
                          <td className="py-1.5">{r.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
            <details className={sectionClass}>
              <summary className={summaryClass}>
                Care <Sign />
              </summary>
              <ul className="pb-5 text-[15px] text-muted">
                {product.care.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </details>
            <details className={sectionClass}>
              <summary className={summaryClass}>
                Delivery &amp; exchanges <Sign />
              </summary>
              <div className="flex flex-col gap-1 pb-5 text-[15px] text-muted">
                <p>Delivery {site.deliveryPromise} across Pakistan.</p>
                <p>Exchange or refund within {site.exchangeWindowDays} days of delivery.</p>
                <p>
                  To request one, fill in the{" "}
                  <Link href="/returns" className="text-emerald underline">
                    exchange or refund form
                  </Link>
                  .
                </p>
              </div>
            </details>
          </div>
        </div>
      </section>

      <section aria-labelledby="related-heading" className="mx-auto max-w-[1280px] px-6 pb-[88px]">
        <h2 id="related-heading" className="mb-7 font-serif text-[40px] font-medium">
          You may also like
        </h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-5 gap-y-7">
          {related.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
