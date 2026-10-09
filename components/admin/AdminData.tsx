"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import { validateAdminProduct, type AdminProduct, type ProductErrors } from "@/lib/admin/product-mapping";
import { saveProduct as saveLocalProduct, useAdminProducts as useLocalProducts } from "@/lib/admin/product-store";
import { canCancel, moveOn, nextAction } from "@/lib/admin/status";
import { clearSampleData, loadSampleData } from "@/lib/admin/sample-data";
import { useHydrated } from "@/lib/local-store";
import { updateOrder, useOrders } from "@/lib/order-store";
import type { Order } from "@/lib/orders";
import { setReturnStatus, useReturns } from "@/lib/return-store";
import type { ReturnRequest } from "@/lib/returns";

/**
 * Where the admin dashboard's data lives:
 * - "database": orders and requests come from the admin API (every customer, every device);
 * - "browser":  the demo without a database, using what was saved in this browser.
 * The admin pages use the hooks below and work the same in both modes.
 */
export type AdminMode = "database" | "browser";

const ModeContext = createContext<AdminMode>("browser");

// ---- Database mode: a small shared store filled from /api/admin/data ----

type Remote = {
  orders: Order[];
  returns: ReturnRequest[];
  products: AdminProduct[];
  ready: boolean;
  error: "" | "unavailable" | "unauthorized";
};
let remote: Remote = { orders: [], returns: [], products: [], ready: false, error: "" };
const listeners = new Set<() => void>();
const setRemote = (next: Partial<Remote>) => {
  remote = { ...remote, ...next };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const serverSnapshot: Remote = { orders: [], returns: [], products: [], ready: false, error: "" };
const useRemote = () => useSyncExternalStore(subscribe, () => remote, () => serverSnapshot);

async function call(url: string, body?: unknown, keepAnswer = false): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, body === undefined ? { cache: "no-store" } : {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      setRemote({ error: "unauthorized" });
      return null;
    }
    const data = (await res.json()) as Record<string, unknown>;
    if (!data.ok) {
      // A refused form (e.g. validation) is passed back as it is; anything else means the database is unreachable.
      if (keepAnswer && res.status < 500) return data;
      setRemote({ error: "unavailable" });
      return null;
    }
    return data;
  } catch {
    setRemote({ error: "unavailable" });
    return null;
  }
}

let lastRefresh = 0;
let inFlight: Promise<void> | null = null;

/** Loads everything again; calls made while a load is running share it. */
function refresh(): Promise<void> {
  if (!inFlight) inFlight = load().finally(() => (inFlight = null));
  return inFlight;
}

async function load() {
  lastRefresh = Date.now();
  const data = await call("/api/admin/data");
  if (data) {
    setRemote({
      orders: data.orders as Order[],
      returns: data.returns as ReturnRequest[],
      products: data.products as AdminProduct[],
      ready: true,
      error: "",
    });
  }
}

function replaceRemoteOrder(order: Order) {
  setRemote({ orders: remote.orders.map((o) => (o.id === order.id ? order : o)) });
}

// ---- Provider ----

export function AdminDataProvider({ mode, children }: { mode: AdminMode; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { error } = useRemote();

  // Load on open, then keep fresh: every 30 seconds and whenever the tab is focused again.
  useEffect(() => {
    if (mode !== "database") return;
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    // Coming back to the tab refreshes too, but not more than once every 10 seconds.
    const onFocus = () => {
      if (Date.now() - lastRefresh > 10_000) void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [mode]);

  // Signed out or session expired: back to the login page.
  useEffect(() => {
    if (error === "unauthorized") router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [error, router, pathname]);

  return <ModeContext value={mode}>{children}</ModeContext>;
}

// ---- Hooks used by the admin pages ----

export function useAdminMode(): AdminMode {
  return useContext(ModeContext);
}

/** True once the data can be shown (browser storage read, or first database load done). */
export function useAdminReady(): boolean {
  const mode = useAdminMode();
  const hydrated = useHydrated();
  const { ready } = useRemote();
  return mode === "database" ? ready : hydrated;
}

/** "unavailable" when the database couldn't be reached on the last try. */
export function useAdminError(): Remote["error"] {
  const mode = useAdminMode();
  const { error } = useRemote();
  return mode === "database" ? error : "";
}

export function useAdminOrders(): Order[] {
  const mode = useAdminMode();
  const local = useOrders();
  const { orders } = useRemote();
  return mode === "database" ? orders : local;
}

export function useAdminReturns(): ReturnRequest[] {
  const mode = useAdminMode();
  const local = useReturns();
  const { returns } = useRemote();
  return mode === "database" ? returns : local;
}

export function useAdminProductList(): AdminProduct[] {
  const mode = useAdminMode();
  const local = useLocalProducts();
  const { products } = useRemote();
  return mode === "database" ? products : local;
}

export type SaveResult = { ok: true; product: AdminProduct } | { ok: false; error: string; fieldErrors?: ProductErrors };

export function useAdminActions() {
  const mode = useAdminMode();
  const db = mode === "database";
  return {
    async advance(id: string) {
      if (!db) return updateOrder(id, (o) => (nextAction(o) ? moveOn(o) : o));
      const data = await call("/api/admin/orders", { id, action: "advance" });
      if (data?.order) replaceRemoteOrder(data.order as Order);
    },
    async cancel(id: string) {
      if (!db) return updateOrder(id, (o) => (canCancel(o) ? { ...o, status: "cancelled" } : o));
      const data = await call("/api/admin/orders", { id, action: "cancel" });
      if (data?.order) replaceRemoteOrder(data.order as Order);
    },
    async decideReturn(id: string, status: "approved" | "rejected") {
      if (!db) return setReturnStatus(id, status);
      const data = await call("/api/admin/returns", { id, status });
      const updated = data?.request as ReturnRequest | undefined;
      if (updated) setRemote({ returns: remote.returns.map((r) => (r.id === updated.id ? updated : r)) });
    },
    async loadSample() {
      if (!db) return loadSampleData();
      if (await call("/api/admin/sample", { action: "load" })) await refresh();
    },
    async clearSample() {
      if (!db) return clearSampleData();
      if (await call("/api/admin/sample", { action: "clear" })) await refresh();
    },
    /** Saves a product: in the database (shop pages update) or, in demo mode, in this browser. */
    async saveProduct(product: AdminProduct, isNew: boolean): Promise<SaveResult> {
      if (!db) {
        const fieldErrors = validateAdminProduct(product);
        if (Object.keys(fieldErrors).length > 0) return { ok: false, error: "Please check the highlighted details.", fieldErrors };
        saveLocalProduct(product);
        return { ok: true, product };
      }
      const data = await call("/api/admin/products", { ...product, isNew }, true);
      if (!data) return { ok: false, error: "Couldn't reach the database. Please try again." };
      if (!data.ok) return { ok: false, error: String(data.error ?? "Couldn't save."), fieldErrors: data.fieldErrors as ProductErrors };
      const saved = data.product as AdminProduct;
      const exists = remote.products.some((p) => p.slug === saved.slug);
      setRemote({ products: exists ? remote.products.map((p) => (p.slug === saved.slug ? saved : p)) : [saved, ...remote.products] });
      return { ok: true, product: saved };
    },
    refresh: db ? refresh : async () => {},
  };
}
