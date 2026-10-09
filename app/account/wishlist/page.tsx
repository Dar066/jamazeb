import type { Metadata } from "next";
import { WishlistView } from "@/components/WishlistView";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false, follow: false },
};

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-10 pb-[88px]">
      <h1 className="mb-4 font-serif text-[44px] leading-tight font-medium sm:text-[52px]">Wishlist</h1>
      <WishlistView />
    </div>
  );
}
