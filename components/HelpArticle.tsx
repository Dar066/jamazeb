import { Breadcrumbs } from "./Breadcrumbs";

/** Heading, breadcrumb and spacing shared by every help page. */
export function HelpArticle({ title, href, intro, children }: { title: string; href: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <article className="flex flex-col gap-8">
      <div>
        <Breadcrumbs items={[{ label: "Help", href: "/help" }, { label: title, href }]} />
        <h1 className="font-serif text-[40px] leading-tight font-medium sm:text-[48px]">{title}</h1>
        {intro && <div className="mt-4 max-w-[640px] text-[17px] leading-relaxed">{intro}</div>}
      </div>
      {children}
    </article>
  );
}

export const h2 = "mb-4 font-serif text-[28px] font-medium";
export const tableCls = "w-full max-w-[480px] text-left text-[15px]";
export const thCls = "border-b border-line-strong py-2 font-medium text-muted";
export const tdCls = "border-b border-line py-2";
