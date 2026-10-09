import type { Metadata } from "next";
import { AdminDataProvider } from "@/components/admin/AdminData";
import { AdminShell } from "@/components/admin/AdminShell";
import { databaseEnabled } from "@/lib/db/client";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Jamazeb Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDataProvider mode={databaseEnabled() ? "database" : "browser"}>
      <AdminShell>{children}</AdminShell>
    </AdminDataProvider>
  );
}
