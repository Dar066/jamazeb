import type { Metadata } from "next";
import { HelpArticle } from "@/components/HelpArticle";

export const metadata: Metadata = {
  title: "Payments",
  description: "Pay cash on delivery, or online with card, Easypaisa, JazzCash or bank account through PayFast.",
  alternates: { canonical: "/help/payments" },
};

export default function PaymentsPage() {
  return (
    <HelpArticle title="Payments" href="/help/payments">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
        <section className="border border-line bg-white p-6">
          <h2 className="mb-2 text-lg font-medium">Cash on delivery</h2>
          <p className="text-[15px] text-muted">
            Pay the rider in cash when your parcel arrives. We confirm every cash-on-delivery order on WhatsApp before
            dispatch.
          </p>
        </section>
        <section className="border border-line bg-white p-6">
          <h2 className="mb-2 text-lg font-medium">Pay online with PayFast</h2>
          <p className="text-[15px] text-muted">
            Debit or credit card, Easypaisa, JazzCash or bank account. Payment happens on PayFast&apos;s secure page; we never
            see or store your card details.
          </p>
        </section>
      </div>
      <p className="text-sm text-muted">
        Demo store: online payments go to a test page and no real money is charged.
      </p>
    </HelpArticle>
  );
}
