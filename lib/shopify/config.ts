// Shopify settings, from environment variables (server only).
// Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_TOKEN and the shop's products,
// prices and stock come from Shopify. Leave them empty and nothing changes.

/** Shopify API version (quarterly releases, each supported for about a year). */
export const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2026-10";

/** "your-store.myshopify.com", without https:// or a trailing slash. */
export function shopifyDomain(): string {
  return (process.env.SHOPIFY_STORE_DOMAIN ?? "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

/** True when products come from Shopify. */
export function shopifyEnabled(): boolean {
  return Boolean(shopifyDomain() && process.env.SHOPIFY_STOREFRONT_TOKEN);
}

/** True when orders placed here also change stock in Shopify (needs an Admin API login). */
export function stockSyncEnabled(): boolean {
  const login = process.env.SHOPIFY_ADMIN_TOKEN || (process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET);
  return shopifyEnabled() && Boolean(login);
}

/** Full address of a Shopify endpoint. A local test server uses plain http. */
export function shopifyUrl(path: string): string {
  const domain = shopifyDomain();
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(domain);
  return `${local ? "http" : "https"}://${domain}${path}`;
}

/** The store's products page in the Shopify admin. */
export function shopifyAdminProductsUrl(): string {
  return `https://admin.shopify.com/store/${shopifyDomain().replace(/\.myshopify\.com$/, "")}/products`;
}
