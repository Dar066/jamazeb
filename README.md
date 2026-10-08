# Jamazeb: e-commerce demo store

A fast, minimal clothing store for Pakistani small businesses, built as a portfolio
project and a reusable starter for client stores.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Vercel
**Data:** mock catalogue for the demo (`lib/catalog.ts`), with Supabase and Shopify adapters planned.
**Payments & delivery:** mock PayFast and courier providers behind swappable interfaces (later phases).

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

## Project structure

```
app/            pages, layout, SEO files (robots, sitemap, icon), fonts
components/     header, footer, product card, chat widget, forms
lib/            site settings, mock catalogue, helpers
```

## Build phases

1. **Foundation:** design system, layout, home page, chat widget, SEO basics, security headers ✅
2. Catalogue: collection pages, filters, search, product pages, product schema
3. Cart, wishlist, checkout with COD and mock PayFast
4. Order tracking, exchange/refund form, customer account
5. Admin dashboard
6. Supabase data, then Shopify adapter
7. Performance and security pass, documentation and hand-over

## Notes

- Fonts (Jost, Cormorant Garamond) are self-hosted under the SIL Open Font License; see `app/fonts/`.
- `npm audit` reports advisories in ESLint's dev-only dependencies. They are not shipped to visitors.
