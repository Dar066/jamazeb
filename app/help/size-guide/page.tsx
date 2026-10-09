import type { Metadata } from "next";
import { HelpArticle, h2, tableCls, tdCls, thCls } from "@/components/HelpArticle";
import { STITCHING_PRICE, sizeChart } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Size guide",
  description: "Garment measurements for Jamazeb ready-to-wear and stitched pieces, sizes XS to XL.",
  alternates: { canonical: "/help/size-guide" },
};

export default function SizeGuidePage() {
  return (
    <HelpArticle
      title="Size guide"
      href="/help/size-guide"
      intro={<p>For ready-to-wear and stitched pieces. Measurements are of the garment, in inches.</p>}
    >
      <section>
        <table className={tableCls}>
          <caption className="sr-only">Garment measurements in inches</caption>
          <thead>
            <tr>
              <th scope="col" className={thCls}>
                Size
              </th>
              <th scope="col" className={thCls}>
                Chest
              </th>
              <th scope="col" className={thCls}>
                Shirt length
              </th>
            </tr>
          </thead>
          <tbody>
            {sizeChart.map((r) => (
              <tr key={r.size}>
                <th scope="row" className={`${tdCls} font-normal`}>
                  {r.size}
                </th>
                <td className={tdCls}>{r.chest} in</td>
                <td className={tdCls}>{r.length} in</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-sm text-muted">Sample measurements for the demo store.</p>
      </section>
      <section>
        <h2 className={h2}>How to measure</h2>
        <ul className="flex max-w-[640px] list-disc flex-col gap-2 pl-5 text-[15px]">
          <li>Chest: measure across a shirt that fits you well, armpit to armpit, and compare with the chart.</li>
          <li>Shirt length: from the highest point of the shoulder down to the hem.</li>
          <li>Between two sizes? Choose the larger one for a relaxed fit.</li>
          <li>Unstitched suits can be stitched to these sizes for {formatPrice(STITCHING_PRICE)} on stitchable designs.</li>
        </ul>
      </section>
    </HelpArticle>
  );
}
