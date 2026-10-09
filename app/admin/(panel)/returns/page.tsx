import type { Metadata } from "next";
import { AdminReturns } from "@/components/admin/AdminReturns";

export const metadata: Metadata = { title: "Exchanges & refunds" };

export default function Page() {
  return <AdminReturns />;
}
