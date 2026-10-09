import Link from "next/link";
import { jsonLd } from "@/lib/jsonld";
import { site } from "@/lib/site";

export type Crumb = { label: string; href: string };

/** Visible breadcrumb trail plus matching BreadcrumbList structured data for Google. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const trail: Crumb[] = [{ label: "Home", href: "/" }, ...items];
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: `${site.url}${c.href === "/" ? "" : c.href}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
      <nav aria-label="Breadcrumb" className="mb-3 text-[13px] text-muted">
        <ol className="flex flex-wrap gap-2">
          {trail.map((c, i) => {
            const last = i === trail.length - 1;
            return (
              <li key={c.href} className="flex gap-2">
                {last ? (
                  <span aria-current="page" className="text-charcoal">
                    {c.label}
                  </span>
                ) : (
                  <>
                    <Link href={c.href} className="text-muted">
                      {c.label}
                    </Link>
                    <span aria-hidden="true">/</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
