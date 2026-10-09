import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderComplete } from "@/components/OrderComplete";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
};

export default function OrderCompletePage() {
  return (
    <div className="mx-auto min-h-[70vh] max-w-[1180px] px-6 pt-16 pb-[88px]">
      <Suspense fallback={null}>
        <OrderComplete />
      </Suspense>
    </div>
  );
}
