import type { MetadataRoute } from "next";
import { categories, products } from "@/lib/catalog";
import { helpTopics } from "@/lib/help";
import { site } from "@/lib/site";

// Lists every public page so search engines can find them.
// Only pages that already exist are listed; new sections are added as they go live.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${site.url}/`, changeFrequency: "daily", priority: 1 },
    ...categories.map((c) => ({
      url: `${site.url}/collections/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${site.url}/products/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...["/help", ...helpTopics.map((t) => t.href)].map((path) => ({
      url: `${site.url}${path}`,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
