import type { Metadata } from "next";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-10 pb-[88px]">
      <h1 className="mb-8 font-serif text-[44px] leading-tight font-medium sm:text-[52px]">Your cart</h1>
      <CartView />
    </div>
  );
}
