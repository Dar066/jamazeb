import type { Metadata } from "next";
import { AccountOrders } from "@/components/AccountOrders";

export const metadata: Metadata = {
  title: "My orders",
};

export default function AccountPage() {
  return <AccountOrders />;
}
