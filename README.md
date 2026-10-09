# Jamazeb: e-commerce demo store

A fast, minimal clothing store for Pakistani small businesses, built as a portfolio
project and a reusable starter for client stores.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Vercel
**Data:** orders and exchange/refund requests in PostgreSQL (Supabase) when `DATABASE_URL` is set; otherwise a browser-only demo mode. Catalogue in `lib/catalog.ts` (moves to the database in Phase 6B).
**Payments & delivery:** mock PayFast and courier providers behind swappable interfaces (`lib/payments/`, `lib/shipping.ts`).

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

## Environment variables

| Name | What it does |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public address of the store, used for SEO links and the sitemap |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Store WhatsApp number (digits only, e.g. `923001234567`). Empty = demo note in chat |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact email shown in the footer |
| `NEXT_PUBLIC_SUPPORT_HOURS` | Customer care hours on Help > Contact, e.g. `Mon–Sat, 10am–7pm` |
| `ADMIN_PASSWORD` | Admin dashboard password. Empty = demo mode (password `jamazeb-demo` shown on the login page) |
| `ADMIN_SESSION_SECRET` | Server-only key that signs the admin sign-in cookie. Any long random string |
| `DATABASE_URL` | Server-only PostgreSQL address (Supabase transaction pooler, `jamazeb_app` login). Empty = demo mode |
| `MOCK_PAYMENT_SECRET` | Server-only key that signs demo payment links and results. Any long random string |

## Project structure

```
app/            pages, layout, SEO files (robots, sitemap, icon), fonts
app/api/        order and payment endpoints
components/     header, footer, product card, cart, checkout, chat widget, forms
lib/            site settings, mock catalogue, stores, validation, shipping, payments
```

## Build phases

1. **Foundation:** design system, layout, home page, chat widget, SEO basics, security headers ✅
2. **Catalogue:** collection pages with filters and sorting, product pages with product schema, search ✅
3. **Cart & checkout:** cart, wishlist, checkout with cash on delivery and mock PayFast ✅
4. **Customer care:** order tracking, exchange/refund form, help pages with FAQ schema, customer account ✅
5. **Admin dashboard:** orders and delivery steps, products and stock, customers, exchange/refund approvals, reports with CSV ✅
6. **Database:** 6A orders and returns in Supabase ✅ · 6B products in the database · then a Shopify adapter
7. Performance and security pass, documentation and hand-over

## How checkout works

1. The cart and wishlist are saved in the shopper's browser (`lib/cart-store.ts`, `lib/wishlist-store.ts`).
2. Checkout sends only product, variant and quantity to `POST /api/orders`. The server validates the
   details, re-reads every price and stock level from the catalogue, adds the delivery charge for the city
   and creates the order. Prices sent from the browser are never trusted.
3. **Cash on delivery:** the order is confirmed straight away; the store confirms it on WhatsApp before dispatch.
4. **PayFast (demo):** the shopper is sent to `/pay/mock` with a signed link (HMAC-SHA256). They approve,
   decline or cancel; the result comes back signed and is checked by `POST /api/payments/verify` before the
   order is shown as paid. An edited amount, order number or result is rejected.
5. To go live, a real `PaymentProvider` (PayFast) and `ShippingProvider` (courier) replace the mocks, with no
   page changes. Until Phase 6, orders are kept in the shopper's browser rather than a database.

## After the order

- **Tracking** (`/track`): order number + mobile number. Steps live in `lib/fulfilment.ts`. In the demo a
  button moves the order forward; in Phase 5 the admin dashboard does it, and a courier API can later.
- **Exchanges & refunds** (`/returns`): open for 5 days after delivery. Cash-on-delivery refunds collect an
  Easypaisa, JazzCash or bank account; online payments are refunded to the same card or wallet.
  Requests go through `POST /api/returns`, which validates them on the server.
- **Account** (`/account`): orders, return requests, saved addresses, wishlist and profile. Checkout fills in
  the saved details. Until Phase 6 these are kept on the shopper's device; sign-in arrives with the database.
- **Help** (`/help/...`): shipping, payments, size guide, contact and FAQs. Wording lives in `lib/help.ts`.

## Admin dashboard

`/admin` is protected by `proxy.ts`: without a valid signed cookie every admin page redirects to `/admin/login`.
The password is checked on the server (`/api/admin/login`), failed attempts are slowed down, and the cookie is
HTTP-only, SameSite=strict and expires after 8 hours.

- **Dashboard:** sales, orders, average order, cash-on-delivery share, 7-day sales chart, things that need attention.
- **Orders:** filter, search, open an order, and move it on: confirm → book courier → in transit → out for delivery →
  delivered. Customers see each step on their tracking page. Orders not yet booked can be cancelled.
- **Products:** edit price, sale price, stock and status; add products; low-stock filter.
- **Customers:** grouped by mobile number with order count and total spent.
- **Returns:** approve or reject exchange/refund requests; the customer sees the decision in their account.
- **Reports:** last 7 / 30 days / all time, payment split, top products, orders by city, CSV download.
- **Load sample data** fills the dashboard with realistic demo orders; **Clear sample data** removes them.

In the demo, the dashboard works on the orders saved in this browser, and product edits don't change the shop pages.
Phase 6 moves orders, products and staff logins to the database.

## Database (Phase 6A)

With `DATABASE_URL` set, orders and exchange/refund requests are saved in PostgreSQL, so the admin sees every
customer's orders and customers see the store's updates on any device. Without it, the store runs in demo mode.

- **Server only.** The browser never talks to the database; only the store's API routes do, through `lib/db/`.
- **Own schema.** Everything lives in the `jamazeb` schema, so it can share a Supabase project with other apps safely.
- **Least privilege.** The store logs in as `jamazeb_app`, which can use only the jamazeb tables (no access to other
  schemas, cannot create or drop tables). Supabase's public API keys have no access to the schema at all.
- **Checked on the server:** order lookups need order number + mobile (and slow down failed tries); exchange/refund
  requests are checked against the stored order, its delivery date and its items; payment results are written only
  after the signature and amount match; admin routes check the sign-in cookie themselves.
- **If the database is unreachable,** checkout says to try again rather than saving an order the admin can't see.

### Setting it up on Supabase

1. SQL Editor → run `db/jamazeb-schema.sql` (creates the `jamazeb` schema and tables; safe to re-run).
2. Put a password into `db/jamazeb-app-user.sql` (letters and numbers), then run it (creates the `jamazeb_app` login).
3. Project → **Connect** → **Transaction pooler**: copy the address, change the user to `jamazeb_app.<project-ref>`
   and the password to the one from step 2. Add it in Vercel as `DATABASE_URL` and redeploy.

### Moving to its own Supabase project later

Run both SQL files in the new project, copy the rows (`pg_dump --schema=jamazeb --data-only` from the old project,
then `psql` into the new one), switch `DATABASE_URL` in Vercel and redeploy. Then drop the `jamazeb` schema in the
old project.

## Notes

- Fonts (Jost, Cormorant Garamond) are self-hosted under the SIL Open Font License; see `app/fonts/`.
- `npm audit` reports advisories in ESLint's dev-only dependencies. They are not shipped to visitors.
