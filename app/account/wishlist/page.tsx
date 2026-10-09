import type { Metadata } from "next";
import { WishlistView } from "@/components/WishlistView";

export const metadata: Metadata = {
  title: "Wishlist",
};

export default function WishlistPage() {
  return (
    <>
      <h1 className="mb-4 font-serif text-[40px] leading-tight font-medium">Wishlist</h1>
      <WishlistView />
    </>
  );
}
