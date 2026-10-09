"use client";

import { usePathname } from "next/navigation";

/** Hides the shop's header, footer and chat on admin pages, which have their own layout. */
export function StoreOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return pathname.startsWith("/admin") ? null : children;
}
