import type { AdminStage } from "@/lib/admin/status";
import { stageBadge, stageLabels } from "@/lib/admin/status";

export function AdminHeading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <h1 className="font-serif text-[40px] leading-tight font-medium">{title}</h1>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function StageBadge({ stage }: { stage: AdminStage }) {
  return <span className={`inline-block px-2 py-0.5 text-[13px] whitespace-nowrap ${stageBadge[stage]}`}>{stageLabels[stage]}</span>;
}

export function Kpi({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border border-line bg-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-[28px] leading-tight font-medium">{value}</p>
      {note && <p className="mt-1 text-[13px] text-muted">{note}</p>}
    </div>
  );
}

export function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="border border-line bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-[15px] text-muted">{children}</p>;
}

export const searchInput =
  "min-h-11 w-full max-w-[280px] border border-line-strong bg-white px-3 text-[15px] placeholder:text-muted-dark focus:outline-2 focus:outline-charcoal";
export const chip = (active: boolean) =>
  `min-h-10 cursor-pointer border px-3 text-[13px] whitespace-nowrap ${active ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong bg-white text-charcoal"}`;
export const th = "border-b border-line-strong px-3 py-2.5 text-left text-[13px] font-medium whitespace-nowrap text-muted";
export const td = "border-b border-line px-3 py-3 align-top text-[15px]";
