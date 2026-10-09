import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or transactional pages that should never appear in search results.
      disallow: ["/admin", "/account", "/cart", "/checkout", "/pay", "/api/"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
