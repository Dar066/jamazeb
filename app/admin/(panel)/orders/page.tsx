import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminOrders } from "@/components/admin/AdminOrders";

export const metadata: Metadata = { title: "Orders" };

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <AdminOrders />
    </Suspense>
  );
}
