"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { needsBooking, needsConfirming } from "@/lib/admin/status";
import { useHydrated } from "@/lib/local-store";
import { useOrders } from "@/lib/order-store";
import { useReturns } from "@/lib/return-store";
import { site } from "@/lib/site";

const menu = [
  { label: "Dashboard", href: "/admin" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Products", href: "/admin/products" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Returns", href: "/admin/returns" },
  { label: "Reports", href: "/admin/reports" },
];

/** Dark side menu with counts of things to do, plus the page heading bar. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const orders = useOrders();
  const returns = useReturns();

  const counts: Record<string, number> = hydrated
    ? {
        "/admin/orders": orders.filter((o) => needsConfirming(o) || needsBooking(o)).length,
        "/admin/returns": returns.filter((r) => r.status === "received").length,
      }
    : {};

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    // A full page load on purpose: it drops every admin page the browser kept in
    // memory, so nothing from the dashboard is left behind after signing out.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone md:flex-row">
      <aside className="bg-charcoal text-[#d9d5cb] md:sticky md:top-0 md:h-screen md:w-[232px] md:shrink-0">
        <div className="flex items-center justify-between gap-4 px-5 py-5 md:block">
          <p className="font-serif text-[26px] font-semibold text-ivory">
            {site.name} <span className="font-sans text-xs tracking-[0.12em] text-muted-dark uppercase">Admin</span>
          </p>
        </div>
        <nav aria-label="Admin" className="overflow-x-auto px-3 pb-3 md:pb-0">
          <ul className="flex gap-1 md:flex-col">
            {menu.map((m) => {
              const current = m.href === "/admin" ? pathname === "/admin" : pathname.startsWith(m.href);
              const count = counts[m.href] ?? 0;
              return (
                <li key={m.href}>
                  <Link
                    href={m.href}
                    aria-current={current ? "page" : undefined}
                    className={`flex min-h-11 items-center justify-between gap-3 px-3 text-[15px] whitespace-nowrap ${
                      current ? "bg-[#33332f] text-white" : "hover:text-white"
                    }`}
                  >
                    {m.label}
                    {count > 0 && (
                      <span className="min-w-6 bg-rust px-1.5 text-center text-xs leading-5 text-white">
                        {count}
                        <span className="sr-only"> to do</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="hidden flex-col gap-1 px-3 pt-6 md:flex">
          <Link href="/" className="flex min-h-11 items-center px-3 text-[15px] hover:text-white">
            View store ↗
          </Link>
          <button type="button" onClick={signOut} className="flex min-h-11 cursor-pointer items-center px-3 text-left text-[15px] hover:text-white">
            Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-end gap-4 border-b border-line bg-white px-6 py-3 text-sm md:hidden">
          <Link href="/" className="min-h-11 content-center">
            View store
          </Link>
          <button type="button" onClick={signOut} className="min-h-11 cursor-pointer">
            Sign out
          </button>
        </div>
        <div className="mx-auto max-w-[1200px] px-6 py-8">{children}</div>
      </div>
    </div>
  );
}
