"use client";

import { useOrders } from "@/lib/order-store";
import { clearSampleData, loadSampleData } from "@/lib/admin/sample-data";
import { btnSmall } from "../ui";

export function SampleDataControls() {
  const hasSample = useOrders().some((o) => o.sample);
  return hasSample ? (
    <button type="button" onClick={() => clearSampleData()} className={btnSmall}>
      Clear sample data
    </button>
  ) : (
    <button type="button" onClick={() => loadSampleData()} className={btnSmall}>
      Load sample data
    </button>
  );
}
