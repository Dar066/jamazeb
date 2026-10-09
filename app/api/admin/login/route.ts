import { cookies } from "next/headers";
import { ADMIN_COOKIE, checkPassword, createSession } from "@/lib/admin-session";
import { json, readJson } from "@/lib/api";

// Slows down password guessing: each failed attempt waits before answering.
const FAIL_DELAY_MS = 800;

export async function POST(request: Request) {
  const body = (await readJson(request)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password.slice(0, 200) : "";

  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, FAIL_DELAY_MS));
    return json({ ok: false, error: "That password isn't right." }, 401);
  }

  const session = createSession();
  (await cookies()).set(ADMIN_COOKIE, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: session.maxAge,
  });
  return json({ ok: true });
}
