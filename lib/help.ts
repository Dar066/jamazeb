// Customer care content shared by the help pages, the exchange form page and
// the FAQ structured data. Edit the wording here once and it updates everywhere.

import { site } from "./site";

export const helpTopics = [
  { label: "Shipping & delivery", href: "/help/shipping" },
  { label: "Payments", href: "/help/payments" },
  { label: "Exchanges & refunds", href: "/returns" },
  { label: "Size guide", href: "/help/size-guide" },
  { label: "Contact us", href: "/help/contact" },
  { label: "FAQs", href: "/help/faqs" },
] as const;

export const returnPolicy = [
  `Request an exchange or refund within ${site.exchangeWindowDays} days of delivery.`,
  "Items must be unused, unwashed and have their tags attached.",
  "Our courier collects the item from your address.",
  "Exchanges are dispatched within 15 days. Refunds are sent within 5 working days of us receiving the item.",
  "Cash-on-delivery orders are refunded to Easypaisa, JazzCash or your bank account. Online payments go back to the same card or wallet.",
];

export const faqs = [
  {
    q: "How long does delivery take?",
    a: `Orders arrive ${site.deliveryPromise} of being placed, anywhere in Pakistan.`,
  },
  {
    q: "Can I pay cash on delivery?",
    a: "Yes. Choose Cash on delivery at checkout and pay the rider when your parcel arrives. We confirm every cash-on-delivery order on WhatsApp before dispatch.",
  },
  {
    q: "How do I track my order?",
    a: "Use the Track order page with your order number and mobile number. We also send updates on WhatsApp.",
  },
  {
    q: "Can I exchange or return an item?",
    a: `Yes, within ${site.exchangeWindowDays} days of delivery, using the exchange or refund form. Items must be unused with tags attached.`,
  },
  {
    q: "Can you stitch an unstitched suit for me?",
    a: "Yes, on suits marked as stitchable. Choose Stitched and your size on the product page; stitching adds to the price shown before you order.",
  },
  {
    q: "Do unstitched suits come with all three pieces?",
    a: "Each product page lists exactly what is included, with fabric and length for every piece.",
  },
];
