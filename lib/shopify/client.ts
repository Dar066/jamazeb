// Small GraphQL clients for Shopify's Storefront API (reading products) and
// Admin API (changing stock). Server only: the tokens never reach the browser.

import { SHOPIFY_API_VERSION, shopifyUrl } from "./config";

export class ShopifyError extends Error {}

type GraphQLAnswer<T> = { data?: T; errors?: { message: string; extensions?: { code?: string } }[] | string };

async function post<T>(url: string, headers: Record<string, string>, query: string, variables: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...headers },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw new ShopifyError(`Shopify could not be reached: ${(error as Error).message}`);
  }
  if (res.status === 401 || res.status === 403) throw new ShopifyError(`Shopify refused the token (${res.status})`);
  if (!res.ok) throw new ShopifyError(`Shopify answered ${res.status}`);
  const body = (await res.json()) as GraphQLAnswer<T>;
  if (body.errors) {
    const list = typeof body.errors === "string" ? [{ message: body.errors }] : body.errors;
    throw new ShopifyError(list.map((e) => e.extensions?.code ? `${e.message} (${e.extensions.code})` : e.message).join("; "));
  }
  if (!body.data) throw new ShopifyError("Shopify sent no data");
  return body.data;
}

/** Storefront API: products as the shop shows them (published to the Headless channel). */
export function storefront<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  return post<T>(
    shopifyUrl(`/api/${SHOPIFY_API_VERSION}/graphql.json`),
    { "Shopify-Storefront-Private-Token": process.env.SHOPIFY_STOREFRONT_TOKEN ?? "" },
    query,
    variables,
  );
}

// ---- Admin API login ----
// Either a fixed token (SHOPIFY_ADMIN_TOKEN), or a Dev Dashboard app's client ID
// and secret, swapped for a token that lasts 24 hours and is renewed here.

let issued: { token: string; expiresAt: number } | null = null;

async function adminToken(): Promise<string> {
  if (process.env.SHOPIFY_ADMIN_TOKEN) return process.env.SHOPIFY_ADMIN_TOKEN;
  if (issued && issued.expiresAt - 60_000 > Date.now()) return issued.token;
  let res: Response;
  try {
    res = await fetch(shopifyUrl("/admin/oauth/access_token"), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.SHOPIFY_CLIENT_ID ?? "",
        client_secret: process.env.SHOPIFY_CLIENT_SECRET ?? "",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw new ShopifyError(`Shopify could not be reached: ${(error as Error).message}`);
  }
  if (!res.ok) throw new ShopifyError(`Shopify refused the app login (${res.status})`);
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new ShopifyError("Shopify sent no access token");
  issued = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return issued.token;
}

/** Admin API, used only to change stock. */
export async function admin<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const url = shopifyUrl(`/admin/api/${SHOPIFY_API_VERSION}/graphql.json`);
  try {
    return await post<T>(url, { "X-Shopify-Access-Token": await adminToken() }, query, variables);
  } catch (error) {
    // A renewed token may have been withdrawn early: get a fresh one and try once more.
    if (issued && error instanceof ShopifyError && error.message.includes("refused the token")) {
      issued = null;
      return post<T>(url, { "X-Shopify-Access-Token": await adminToken() }, query, variables);
    }
    throw error;
  }
}
