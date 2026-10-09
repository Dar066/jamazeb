import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidSession } from "./admin-session";
import { json } from "./api";

/**
 * Every admin API checks the sign-in cookie itself. proxy.ts only guards the
 * admin pages, so the data endpoints must never rely on it.
 */
export async function requireAdmin(): Promise<Response | null> {
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return isValidSession(value) ? null : json({ ok: false, error: "unauthorized" }, 401);
}
