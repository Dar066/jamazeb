import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductGrid } from "@/components/ProductGrid";
import { categories, getCategory, getProductsInCategory } from "@/lib/catalog";
import { jsonLd } from "@/lib/jsonld";
import { site } from "@/lib/site";

// Every collection is built ahead of time as a static page.
// "navigation" means the whole page is produced before anything is sent, so an
// unknown address returns a real 404 status instead of a 200 "not found" page.
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  const path = `/collections/${category.slug}`;
  const title = category.slug === "sale" ? "Sale" : `${category.name} Collection`;
  return {
    title,
    description: `${category.description} Shop ${category.name.toLowerCase()} online at ${site.name} with cash on delivery across Pakistan.`,
    alternates: { canonical: path },
    openGraph: { url: path, title: `${title} | ${site.name}` },
  };
}

export default async function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const products = getProductsInCategory(category.slug);

  // Lets search engines understand the page as a list of products.
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description,
    url: `${site.url}/collections/${category.slug}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${site.url}/products/${p.slug}`,
        name: p.name,
      })),
    },
  };

  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-8 pb-[88px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <Breadcrumbs items={[{ label: category.name, href: `/collections/${category.slug}` }]} />
      <h1 className="mb-2 font-serif text-[44px] leading-tight font-medium sm:text-[52px]">{category.name}</h1>
      <p className="mb-8 text-muted">{category.description}</p>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="flex flex-col items-center gap-4 border border-line px-6 py-16 text-center">
          <p className="text-muted">New pieces are on the way. Take a look at our latest arrivals in the meantime.</p>
          <Link
            href="/collections/new-in"
            className="inline-flex min-h-12 items-center bg-emerald px-7 text-sm tracking-[0.12em] text-white uppercase hover:text-white"
          >
            See new arrivals
          </Link>
        </div>
      )}
    </div>
  );
}
