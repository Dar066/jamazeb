"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { btnPrimary, fieldInput, fieldLabel } from "../ui";

export function AdminLogin({ demoPassword }: { demoPassword: string | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Only return to admin pages after signing in, never to another site.
  const next = params.get("next") ?? "";
  const target = next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        router.replace(target);
        router.refresh();
        return;
      }
      setError(data.error ?? "Sign-in failed.");
    } catch {
      setError("Couldn't reach the server. Try again.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor="password" className={fieldLabel}>
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "password-error" : undefined}
          className={`${fieldInput} ${error ? "border-rust" : "border-line-strong"}`}
        />
        <div aria-live="polite">
          {error && (
            <p id="password-error" className="mt-1.5 text-sm text-rust">
              {error}
            </p>
          )}
        </div>
      </div>
      <button type="submit" disabled={busy || !password} className={btnPrimary}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      {demoPassword && (
        <p className="bg-sand p-3 text-sm">
          Demo store: the password is <code className="font-medium">{demoPassword}</code>
        </p>
      )}
    </form>
  );
}
