import type { Metadata } from "next";
import Link from "next/link";
import { HelpArticle, h2, tableCls, tdCls, thCls } from "@/components/HelpArticle";
import { formatPrice } from "@/lib/format";
import { shipping } from "@/lib/shipping";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shipping & delivery",
  description: `Jamazeb delivers to every city in Pakistan ${site.deliveryPromise}. See delivery charges by city.`,
  alternates: { canonical: "/help/shipping" },
};

export default function ShippingPage() {
  return (
    <HelpArticle
      title="Shipping & delivery"
      href="/help/shipping"
      intro={
        <p>
          We deliver to every city in Pakistan through our courier partner. Orders arrive {site.deliveryPromise} of being
          placed. Once your parcel is booked, you get a tracking number on WhatsApp and can follow it on the{" "}
          <Link href="/track" className="underline underline-offset-4">
            Track order
          </Link>{" "}
          page.
        </p>
      }
    >
      <section>
        <h2 className={h2}>Delivery charges</h2>
        <table className={tableCls}>
          <thead>
            <tr>
              <th scope="col" className={thCls}>
                City
              </th>
              <th scope="col" className={thCls}>
                Charge
              </th>
            </tr>
          </thead>
          <tbody>
            {shipping.cities.map((city) => (
              <tr key={city}>
                <th scope="row" className={`${tdCls} font-normal`}>
                  {city}
                </th>
                <td className={tdCls}>{formatPrice(shipping.getRate(city))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-sm text-muted">
          Charges shown are demo rates. The exact charge for your city is shown at checkout before you place your order.
        </p>
      </section>
    </HelpArticle>
  );
}
