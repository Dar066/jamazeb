"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { helpTopics } from "@/lib/help";

/** Topic list beside every help page. */
export function HelpNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Help topics" className="flex-[0_0_220px]">
      <ul className="flex flex-wrap gap-x-5 gap-y-1 border-b border-line pb-3 md:flex-col md:border-b-0 md:pb-0">
        {helpTopics.map((t) => {
          const current = pathname === t.href;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-11 items-center text-[15px] ${current ? "font-medium text-emerald" : "text-charcoal hover:text-emerald"}`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
