import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackOrder } from "@/components/TrackOrder";
import { pageTitle } from "@/components/ui";
import { databaseEnabled } from "@/lib/db/client";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Track your Jamazeb order with your order number and mobile number.",
  alternates: { canonical: "/track" },
  robots: { index: false, follow: true },
};

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-[760px] px-6 pt-10 pb-[88px]">
      <h1 className={`mb-3 ${pageTitle}`}>Track your order</h1>
      <p className="mb-8 text-muted">Enter your order number and the mobile number you used at checkout.</p>
      <div className="min-h-[50vh]">
        <Suspense fallback={null}>
          <TrackOrder databaseMode={databaseEnabled()} />
        </Suspense>
      </div>
    </div>
  );
}
