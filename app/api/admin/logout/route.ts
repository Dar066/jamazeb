import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin-session";
import { json } from "@/lib/api";

export async function POST() {
  (await cookies()).delete(ADMIN_COOKIE);
  return json({ ok: true });
}
