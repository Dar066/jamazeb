# Jamazeb: e-commerce demo store

A fast, minimal clothing store for Pakistani small businesses, built as a portfolio
project and a reusable starter for client stores.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Vercel
**Data:** mock catalogue for the demo (`lib/catalog.ts`), with Supabase and Shopify adapters planned.
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
5. Admin dashboard
6. Supabase data, then Shopify adapter
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

## Notes

- Fonts (Jost, Cormorant Garamond) are self-hosted under the SIL Open Font License; see `app/fonts/`.
- `npm audit` reports advisories in ESLint's dev-only dependencies. They are not shipped to visitors.
