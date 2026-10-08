import Link from "next/link";

export function AnnouncementBar() {
  return (
    <div className="bg-charcoal px-4 py-2.5 text-center text-[13px] tracking-[0.08em] text-ivory">
      Cash on delivery across Pakistan ·{" "}
      <Link href="/track" className="underline hover:text-ivory">
        Track your order anytime
      </Link>
    </div>
  );
}
