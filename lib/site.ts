// Store-wide settings. Values that change per client come from environment
// variables (see .env.example) so the same code can be deployed for any store.

// Order of preference: the address set by hand, then the production address
// Vercel provides automatically, then localhost for development.
const rawUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "http://localhost:3000";

export const site = {
  name: "Jamazeb",
  tagline: "Everyday clothing that suits you.",
  description:
    "Printed lawn, unstitched suits and ready-to-wear pieces, delivered across Pakistan with cash on delivery and easy exchanges.",
  url: rawUrl.replace(/\/$/, ""),
  city: "Lahore, Pakistan",
  // Digits only, international format without "+", e.g. 923001234567.
  // Leave empty until the store's real WhatsApp number is known.
  whatsappNumber: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/[^0-9]/g, ""),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  /** Customer care hours shown on the contact page, e.g. "Mon–Sat, 10am–7pm". */
  supportHours: process.env.NEXT_PUBLIC_SUPPORT_HOURS || "",
  deliveryPromise: "within 15 days",
  exchangeWindowDays: 5,
} as const;

/** Builds a WhatsApp click-to-chat link, or null when no number is configured. */
export function whatsappLink(message: string): string | null {
  if (!site.whatsappNumber) return null;
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export const mainNav = [
  { label: "New In", href: "/collections/new-in" },
  { label: "Lawn", href: "/collections/lawn" },
  { label: "Unstitched", href: "/collections/unstitched" },
  { label: "Ready to Wear", href: "/collections/ready-to-wear" },
  { label: "Sale", href: "/collections/sale", highlight: true },
] as const;
