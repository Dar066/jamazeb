import type { Metadata } from "next";
import { AdminCustomers } from "@/components/admin/AdminCustomers";

export const metadata: Metadata = { title: "Customers" };

export default function Page() {
  return <AdminCustomers />;
}
