"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHydrated } from "@/lib/local-store";
import { useProfile } from "@/lib/profile-store";

const links = [
  { label: "My orders", href: "/account" },
  { label: "Saved addresses", href: "/account/addresses" },
  { label: "Wishlist", href: "/account/wishlist" },
  { label: "Profile", href: "/account/profile" },
];

/** Greeting and section links shown on every account page. */
export function AccountNav() {
  const pathname = usePathname();
  const profile = useProfile();
  const hydrated = useHydrated();
  const firstName = profile.name.trim().split(/\s+/)[0];

  return (
    <div className="flex flex-col gap-6">
      <p className="min-h-[1.5em] font-serif text-[28px] leading-tight font-medium">
        {hydrated && firstName ? `Hello, ${firstName}` : "My account"}
      </p>
      <nav aria-label="Account">
        <ul className="flex flex-wrap gap-x-5 gap-y-1 border-b border-line pb-3 md:flex-col md:border-b-0 md:pb-0">
          {links.map((l) => {
            const current = pathname === l.href;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={current ? "page" : undefined}
                  className={`flex min-h-11 items-center text-[15px] ${current ? "font-medium text-emerald" : "text-charcoal hover:text-emerald"}`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
