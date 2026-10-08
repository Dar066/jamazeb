import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-[640px] flex-col items-center gap-5 px-6 py-24 text-center">
      <p className="text-[13px] tracking-[0.2em] text-emerald uppercase">Page not found</p>
      <h1 className="font-serif text-5xl font-medium">This page isn&apos;t here yet</h1>
      <p className="text-muted">
        It may have moved, or it&apos;s still being built for the demo store. Try one of these instead.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-12 items-center bg-emerald px-7 text-sm tracking-[0.12em] text-white uppercase hover:text-white"
        >
          Back to home
        </Link>
        <Link
          href="/collections/new-in"
          className="inline-flex min-h-12 items-center border border-charcoal px-7 text-sm tracking-[0.12em] uppercase"
        >
          See new arrivals
        </Link>
      </div>
    </section>
  );
}
