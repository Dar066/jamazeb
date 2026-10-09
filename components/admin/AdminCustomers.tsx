"use client";

import { useState } from "react";
import { customers } from "@/lib/admin/metrics";
import { formatDate, formatPrice } from "@/lib/format";
import { useHydrated } from "@/lib/local-store";
import { useOrders } from "@/lib/order-store";
import { AdminHeading, EmptyNote, searchInput, td, th } from "./ui";

export function AdminCustomers() {
  const hydrated = useHydrated();
  const orders = useOrders();
  const [query, setQuery] = useState("");

  if (!hydrated) return <div aria-busy="true" className="min-h-[70vh]" />;

  const q = query.trim().toLowerCase();
  const rows = customers(orders).filter((c) => !q || `${c.name} ${c.city} ${c.phone}`.toLowerCase().includes(q));

  return (
    <div className="flex flex-col gap-5">
      <AdminHeading title="Customers">
        <label className="w-full max-w-[280px]">
          <span className="sr-only">Search customers</span>
          <input type="search" placeholder="Search name, city, mobile" value={query} onChange={(e) => setQuery(e.target.value)} className={searchInput} />
        </label>
      </AdminHeading>
      <div className="overflow-x-auto border border-line bg-white">
        {rows.length === 0 ? (
          <EmptyNote>{orders.length === 0 ? "Customers appear here after their first order." : "No customers match."}</EmptyNote>
        ) : (
          <table className="w-full min-w-[720px] border-collapse">
            <caption className="sr-only">Customers, most recent first</caption>
            <thead>
              <tr>
                <th scope="col" className={th}>Customer</th>
                <th scope="col" className={th}>Mobile</th>
                <th scope="col" className={th}>City</th>
                <th scope="col" className={`${th} text-right`}>Orders</th>
                <th scope="col" className={`${th} text-right`}>Total spent</th>
                <th scope="col" className={th}>Last order</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.phone}>
                  <td className={td}>{c.name}</td>
                  <td className={td}>
                    <a href={`https://wa.me/92${c.phone.slice(1)}`} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                      {c.phone.replace(/^(\d{4})(\d{7})$/, "$1 $2")}
                    </a>
                  </td>
                  <td className={td}>{c.city}</td>
                  <td className={`${td} text-right`}>{c.orders}</td>
                  <td className={`${td} text-right`}>{formatPrice(c.spent)}</td>
                  <td className={td}>{formatDate(c.lastOrder)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-[13px] text-muted">Customers are grouped by mobile number. Total spent leaves out unpaid and cancelled orders.</p>
    </div>
  );
}
