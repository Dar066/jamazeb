import type { Metadata } from "next";
import { AdminDataProvider } from "@/components/admin/AdminData";
import { AdminShell } from "@/components/admin/AdminShell";
import { databaseEnabled } from "@/lib/db/client";
import { shopifyAdminProductsUrl, shopifyEnabled } from "@/lib/shopify/config";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Jamazeb Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDataProvider
      mode={databaseEnabled() ? "database" : "browser"}
      shopifyUrl={shopifyEnabled() ? shopifyAdminProductsUrl() : undefined}
    >
      <AdminShell>{children}</AdminShell>
    </AdminDataProvider>
  );
}
