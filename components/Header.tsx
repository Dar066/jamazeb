import Link from "next/link";
import { mainNav, site } from "@/lib/site";
import { BagIcon, HeartIcon, SearchIcon, UserIcon } from "./icons";

const iconLink = "flex h-11 w-11 items-center justify-center text-charcoal";

export function Header() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="font-serif text-[34px] font-semibold tracking-[0.04em] text-charcoal">
          {site.name}
        </Link>

        <nav aria-label="Main" className="flex flex-wrap gap-x-7 gap-y-2 text-sm uppercase tracking-[0.1em]">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={"highlight" in item && item.highlight ? "text-emerald" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link href="/search" aria-label="Search" className={iconLink}>
            <SearchIcon />
          </Link>
          <Link href="/account/wishlist" aria-label="Wishlist" className={iconLink}>
            <HeartIcon />
          </Link>
          <Link href="/account" aria-label="Account" className={iconLink}>
            <UserIcon />
          </Link>
          <Link href="/cart" aria-label="Cart" className="flex h-11 items-center gap-1.5 px-2.5 text-sm text-charcoal">
            <BagIcon />
            <span>Cart</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
