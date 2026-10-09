import { normalizePkMobile } from "../validation";

const ORDER_ID = /^JZ-[0-9]{6}$/;

/** Cleans an { id, phone } pair from a request, or null if either part is invalid. */
export function cleanPair(raw: unknown): { id: string; phone: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id.trim().toUpperCase() : "";
  const phone = typeof r.phone === "string" ? normalizePkMobile(r.phone) : null;
  return ORDER_ID.test(id) && phone ? { id, phone } : null;
}

/** Small pause before answering "not found", so order numbers can't be tried quickly one after another. */
export const slowDown = () => new Promise((r) => setTimeout(r, 400));
