import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { helpTopics } from "@/lib/help";

export const metadata: Metadata = {
  title: "Help & customer care",
  description: "Delivery, payments, exchanges, sizes and answers to common questions about shopping at Jamazeb.",
  alternates: { canonical: "/help" },
};

export default function HelpIndexPage() {
  return (
    <article className="flex flex-col gap-8">
      <div>
        <Breadcrumbs items={[{ label: "Help", href: "/help" }]} />
        <h1 className="font-serif text-[40px] leading-tight font-medium sm:text-[48px]">How can we help?</h1>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {[{ label: "Track your order", href: "/track" }, ...helpTopics].map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="flex min-h-24 items-end border border-line bg-white p-5 text-[17px] hover:border-charcoal">
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
