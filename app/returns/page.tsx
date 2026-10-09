import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ReturnForm } from "@/components/ReturnForm";
import { pageTitle } from "@/components/ui";
import { returnPolicy } from "@/lib/help";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Exchanges & refunds",
  description: `Exchange or refund any Jamazeb order within ${site.exchangeWindowDays} days of delivery. Request it online in a minute.`,
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-[860px] px-6 pt-10 pb-[88px]">
      <Breadcrumbs items={[{ label: "Help", href: "/help" }, { label: "Exchanges & refunds", href: "/returns" }]} />
      <h1 className={`mb-4 ${pageTitle}`}>Exchange or refund</h1>
      <p className="mb-6 text-[17px]">
        Requests are accepted within {site.exchangeWindowDays} days of delivery. Items must be unused, unwashed and have
        their tags attached.
      </p>
      <details className="mb-10 border border-line bg-white p-5">
        <summary className="cursor-pointer text-[15px] font-medium">Full exchange &amp; refund policy</summary>
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-[15px]">
          {returnPolicy.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">
          Questions? See the{" "}
          <Link href="/help/faqs" className="underline underline-offset-4">
            FAQs
          </Link>{" "}
          or{" "}
          <Link href="/help/contact" className="underline underline-offset-4">
            contact us
          </Link>
          .
        </p>
      </details>
      <div className="min-h-[40vh]">
        <Suspense fallback={null}>
          <ReturnForm />
        </Suspense>
      </div>
    </div>
  );
}
