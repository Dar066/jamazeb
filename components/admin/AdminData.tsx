"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
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

type Remote = { orders: Order[]; returns: ReturnRequest[]; ready: boolean; error: "" | "unavailable" | "unauthorized" };
let remote: Remote = { orders: [], returns: [], ready: false, error: "" };
const listeners = new Set<() => void>();
const setRemote = (next: Partial<Remote>) => {
  remote = { ...remote, ...next };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const serverSnapshot: Remote = { orders: [], returns: [], ready: false, error: "" };
const useRemote = () => useSyncExternalStore(subscribe, () => remote, () => serverSnapshot);

async function call(url: string, body?: unknown): Promise<Record<string, unknown> | null> {
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
      setRemote({ error: "unavailable" });
      return null;
    }
    return data;
  } catch {
    setRemote({ error: "unavailable" });
    return null;
  }
}

async function refresh() {
  const data = await call("/api/admin/data");
  if (data) setRemote({ orders: data.orders as Order[], returns: data.returns as ReturnRequest[], ready: true, error: "" });
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
    const onFocus = () => void refresh();
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
    refresh: db ? refresh : async () => {},
  };
}
