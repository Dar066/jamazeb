import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminProducts } from "@/components/admin/AdminProducts";

export const metadata: Metadata = { title: "Products" };

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <AdminProducts />
    </Suspense>
  );
}
