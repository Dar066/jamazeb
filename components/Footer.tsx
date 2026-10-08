import Link from "next/link";
import { site } from "@/lib/site";

const shopLinks = [
  { label: "New In", href: "/collections/new-in" },
  { label: "Lawn", href: "/collections/lawn" },
  { label: "Unstitched", href: "/collections/unstitched" },
  { label: "Ready to Wear", href: "/collections/ready-to-wear" },
];

const helpLinks = [
  { label: "Track your order", href: "/track" },
  { label: "Shipping & delivery", href: "/help/shipping" },
  { label: "Exchanges & refunds", href: "/returns" },
  { label: "Size guide", href: "/help/size-guide" },
  { label: "FAQs", href: "/help/faqs" },
];

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="flex flex-col gap-2.5 text-[15px]">
      <h2 className="text-[13px] uppercase tracking-[0.12em] text-ivory">{title}</h2>
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="text-[#d9d5cb] hover:text-ivory">
          {l.label}
        </Link>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-charcoal text-[#d9d5cb]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-10 px-6 pt-16 pb-8">
        <div className="flex flex-col gap-3">
          <p className="font-serif text-3xl font-semibold text-ivory">{site.name}</p>
          <p className="text-[15px]">{site.tagline}</p>
        </div>
        <FooterColumn title="Shop" links={shopLinks} />
        <FooterColumn title="Help" links={helpLinks} />
        <div className="flex flex-col gap-2.5 text-[15px]">
          <h2 className="text-[13px] uppercase tracking-[0.12em] text-ivory">Contact</h2>
          <p>WhatsApp: {site.whatsappNumber ? `+${site.whatsappNumber}` : "[YOUR NUMBER]"}</p>
          <p>Email: {site.email || "[YOUR EMAIL]"}</p>
          <p>{site.city}</p>
        </div>
      </div>
      <div className="mx-auto max-w-[1280px] border-t border-[#3a3a37] px-6 pt-5 pb-8 text-[13px] text-muted-dark">
        © {site.name}. Demo store.
      </div>
    </footer>
  );
}
