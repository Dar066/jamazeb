import { HelpNav } from "@/components/HelpNav";

export default function HelpLayout({ children }: LayoutProps<"/help">) {
  return (
    <div className="mx-auto max-w-[1180px] px-6 pt-10 pb-[88px]">
      <p className="mb-6 text-sm tracking-[0.12em] text-muted uppercase">Help &amp; customer care</p>
      <div className="flex flex-col gap-10 md:flex-row md:gap-16">
        <HelpNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
