import type { Metadata } from "next";
import { Suspense } from "react";
import { MockGateway } from "@/components/MockGateway";

export const metadata: Metadata = {
  title: "Demo payment",
  robots: { index: false, follow: false },
};

export default function MockPaymentPage() {
  return (
    <div className="mx-auto max-w-[560px] px-6 pt-10 pb-[88px]">
      <p className="mb-6 bg-rust-soft p-4 text-sm">
        <strong>Demo payment page.</strong> This stands in for the payment gateway so the checkout can be tested. No card
        details are asked for and no real money is charged.
      </p>
      <h1 className="mb-6 font-serif text-[40px] leading-tight font-medium">Complete your payment</h1>
      <div className="min-h-[360px]">
        <Suspense fallback={null}>
          <MockGateway />
        </Suspense>
      </div>
    </div>
  );
}
