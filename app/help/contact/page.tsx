import type { Metadata } from "next";
import { HelpArticle } from "@/components/HelpArticle";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Contact Jamazeb customer care on WhatsApp or email.",
  alternates: { canonical: "/help/contact" },
};

export default function ContactPage() {
  const rows = [
    { label: "WhatsApp", value: site.whatsappNumber ? `+${site.whatsappNumber}` : "[YOUR NUMBER]", href: site.whatsappNumber ? `https://wa.me/${site.whatsappNumber}` : undefined },
    { label: "Email", value: site.email || "[YOUR EMAIL]", href: site.email ? `mailto:${site.email}` : undefined },
    { label: "Based in", value: site.city },
  ];
  return (
    <HelpArticle title="Contact us" href="/help/contact">
      <dl className="grid max-w-[640px] grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {rows.map((r) => (
          <div key={r.label} className="border border-line bg-white p-5">
            <dt className="text-sm text-muted">{r.label}</dt>
            <dd className="mt-1 text-[17px]">
              {r.href ? (
                <a href={r.href} className="underline underline-offset-4">
                  {r.value}
                </a>
              ) : (
                r.value
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-[15px] text-muted">Customer care hours: {site.supportHours || "[YOUR HOURS]"}.</p>
    </HelpArticle>
  );
}
