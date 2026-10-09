import type { Metadata } from "next";
import { AdminReports } from "@/components/admin/AdminReports";

export const metadata: Metadata = { title: "Reports" };

export default function Page() {
  return <AdminReports />;
}
