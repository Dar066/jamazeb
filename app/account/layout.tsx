import type { Metadata } from "next";
import { AccountNav } from "@/components/AccountNav";

export const metadata: Metadata = {
  title: { default: "My account", template: "%s | Jamazeb" },
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-10 pb-[88px]">
      <p className="mb-8 bg-sand p-4 text-sm">
        <strong className="font-medium">Demo account:</strong> your orders, addresses and wishlist are saved on this device.
        Signing in with your mobile number arrives when the store is connected to its database.
      </p>
      <div className="flex flex-col gap-10 md:flex-row md:gap-16">
        <div className="md:flex-[0_0_220px]">
          <AccountNav />
        </div>
        <div className="min-h-[50vh] min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
