// Admin sign-in for the demo dashboard: one shared password, checked on the
// server, then a signed cookie that expires after 8 hours. proxy.ts checks the
// cookie before any /admin page loads. Phase 6 replaces this with Supabase
// accounts and per-staff logins.

import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "jz_admin";
export const SESSION_HOURS = 8;

/** Password shown on the login page when ADMIN_PASSWORD is not set, so visitors can try the demo. */
export const DEMO_PASSWORD = "jamazeb-demo";

export const isDemoLogin = () => !process.env.ADMIN_PASSWORD;

const secret = () => process.env.ADMIN_SESSION_SECRET || process.env.MOCK_PAYMENT_SECRET || "jamazeb-demo-admin-secret";

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || DEMO_PASSWORD;
  // Compare hashes so the check takes the same time whatever the length.
  return safeEqual(sign(`pw:${input}`), sign(`pw:${expected}`));
}

/** Cookie value: "<expiry ms>.<signature>". */
export function createSession(now = Date.now()): { value: string; maxAge: number } {
  const expires = now + SESSION_HOURS * 60 * 60 * 1000;
  return { value: `${expires}.${sign(`session:${expires}`)}`, maxAge: SESSION_HOURS * 60 * 60 };
}

export function isValidSession(value: string | undefined, now = Date.now()): boolean {
  if (!value) return false;
  const [expires, sig] = value.split(".");
  if (!/^[0-9]{13}$/.test(expires ?? "") || !sig) return false;
  if (Number(expires) < now) return false;
  return safeEqual(sig, sign(`session:${expires}`));
}
