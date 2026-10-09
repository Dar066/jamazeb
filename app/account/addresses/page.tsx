import type { Metadata } from "next";
import { AccountAddresses } from "@/components/AccountAddresses";

export const metadata: Metadata = {
  title: "Saved addresses",
};

export default function AddressesPage() {
  return <AccountAddresses />;
}
