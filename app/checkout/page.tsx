import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-6 pt-10 pb-[88px]">
      <h1 className="mb-8 font-serif text-[44px] leading-tight font-medium sm:text-[52px]">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
