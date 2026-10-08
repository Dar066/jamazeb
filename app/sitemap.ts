import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Lists every public page so search engines can find them.
// Only pages that already exist are listed: collection and product pages are
// added here in Phase 2, when those routes go live.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${site.url}/`, changeFrequency: "daily", priority: 1 }];
}
