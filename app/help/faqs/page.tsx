import type { Metadata } from "next";
import { HelpArticle } from "@/components/HelpArticle";
import { faqs } from "@/lib/help";
import { jsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Answers about delivery times, cash on delivery, order tracking, exchanges and stitching at Jamazeb.",
  alternates: { canonical: "/help/faqs" },
};

export default function FaqsPage() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <HelpArticle title="Frequently asked questions" href="/help/faqs">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
      <div className="max-w-[720px] border-t border-line">
        {faqs.map((f, i) => (
          <details key={f.q} open={i === 0} className="group border-b border-line">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-[17px] [&::-webkit-details-marker]:hidden">
              <h2 className="font-normal">{f.q}</h2>
              <span aria-hidden="true" className="text-xl group-open:hidden">
                +
              </span>
              <span aria-hidden="true" className="hidden text-xl group-open:inline">
                −
              </span>
            </summary>
            <p className="pb-5 text-[15px] text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </HelpArticle>
  );
}
