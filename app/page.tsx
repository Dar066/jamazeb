import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterForm } from "@/components/NewsletterForm";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { featuredCategories, getCategory, getNewArrivals } from "@/lib/catalog";
import { getCatalog } from "@/lib/catalog-source";
import { jsonLd } from "@/lib/jsonld";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

const buttonPrimary =
  "inline-flex min-h-12 items-center bg-emerald px-7 text-sm tracking-[0.12em] text-white uppercase hover:text-white";
const buttonOutline =
  "inline-flex min-h-12 items-center border border-charcoal px-7 text-sm tracking-[0.12em] uppercase";

const promises = [
  { title: "Cash on delivery", text: "Pay when your parcel arrives, anywhere in Pakistan." },
  { title: "Online payment", text: "Cards, Easypaisa and JazzCash at checkout." },
  { title: "Live order tracking", text: "Follow your order from packing to your door." },
  {
    title: "Exchanges & refunds",
    text: `Within ${site.exchangeWindowDays} days of delivery, through a simple request form.`,
  },
];

export default async function HomePage() {
  const newArrivals = getNewArrivals(4, await getCatalog());
  const tiles = featuredCategories.map((slug) => getCategory(slug)!);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ClothingStore",
        "@id": `${site.url}/#store`,
        name: site.name,
        url: site.url,
        description: site.description,
        address: { "@type": "PostalAddress", addressLocality: "Lahore", addressCountry: "PK" },
        paymentAccepted: "Cash, Credit Card, Debit Card, Easypaisa, JazzCash",
        currenciesAccepted: "PKR",
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        name: site.name,
        url: site.url,
        potentialAction: {
          "@type": "SearchAction",
          target: `${site.url}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      <section className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-12 px-6 pt-12 pb-[72px]">
        <div className="flex flex-[1_1_360px] flex-col gap-6">
          <p className="text-[13px] tracking-[0.2em] text-emerald uppercase">New Collection</p>
          <h1 className="font-serif text-5xl leading-[1.05] font-medium sm:text-[64px]">
            Dressed well,
            <br />
            every day.
          </h1>
          <p className="max-w-[440px] text-[17px] text-muted">
            Printed lawn, unstitched suits and ready-to-wear pieces, chosen for comfort and made to be worn often.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/collections/new-in" className={buttonPrimary}>
              Shop new arrivals
            </Link>
            <Link href="/collections/lawn" className={buttonOutline}>
              Explore lawn
            </Link>
          </div>
        </div>
        <ProductImage
          tone="#E4DDCD"
          label="Model wearing a printed lawn suit from the new collection"
          className="h-[420px] flex-[1_1_480px] sm:h-[560px]"
        />
      </section>

      <section aria-labelledby="categories-heading" className="mx-auto max-w-[1280px] px-6 pb-20">
        <h2 id="categories-heading" className="mb-7 font-serif text-[40px] font-medium">
          Shop by category
        </h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
          {tiles.map((cat) => (
            <Link key={cat.slug} href={`/collections/${cat.slug}`} className="group flex flex-col gap-3">
              <ProductImage tone={cat.tone} label={`${cat.name} collection`} className="h-80" />
              <span className="text-[15px] tracking-[0.12em] uppercase group-hover:text-emerald">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="new-heading" className="mx-auto max-w-[1280px] px-6 pb-[88px]">
        <div className="mb-7 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="new-heading" className="font-serif text-[40px] font-medium">
            New arrivals
          </h2>
          <Link
            href="/collections/new-in"
            className="border-b border-current text-sm tracking-[0.12em] uppercase"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-5 gap-y-7">
          {newArrivals.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      <section aria-label="Why shop with us" className="border-y border-line bg-sand">
        <div className="mx-auto grid max-w-[1280px] grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-8 px-6 py-12">
          {promises.map((p) => (
            <div key={p.title} className="flex flex-col gap-1.5">
              <h3 className="font-serif text-2xl font-semibold">{p.title}</h3>
              <p className="text-[15px] text-muted">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="newsletter-heading"
        className="mx-auto flex max-w-[760px] flex-col items-center gap-4 px-6 py-[88px] text-center"
      >
        <h2 id="newsletter-heading" className="font-serif text-[40px] font-medium">
          First to know about new drops
        </h2>
        <p className="text-muted">Get new collections and sale alerts on email or WhatsApp.</p>
        <NewsletterForm />
      </section>
    </>
  );
}
