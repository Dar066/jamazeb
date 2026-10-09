"use client";

// Sample data in demo (browser) mode. In database mode the admin API builds the
// same data on the server instead (see app/api/admin/sample).

import { getOrders, replaceOrders } from "../order-store";
import { getReturns, replaceReturns } from "../return-store";
import { buildSampleData } from "./sample-builder";

export function loadSampleData(now = Date.now()) {
  const { orders, returns } = buildSampleData(now);
  const keepOrders = getOrders().filter((o) => !o.sample);
  const keepReturns = getReturns().filter((r) => !r.sample);
  replaceOrders([...keepOrders, ...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  replaceReturns([...returns, ...keepReturns]);
}

export function clearSampleData() {
  replaceOrders(getOrders().filter((o) => !o.sample));
  replaceReturns(getReturns().filter((r) => !r.sample));
}
