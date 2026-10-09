import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { DEMO_PASSWORD, isDemoLogin } from "@/lib/admin-session";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone px-6 py-16">
      <div className="w-full max-w-[400px] border border-line bg-white p-8">
        <p className="font-serif text-[32px] font-semibold">{site.name}</p>
        <h1 className="mb-6 text-sm tracking-[0.12em] text-muted uppercase">Admin sign in</h1>
        <Suspense fallback={null}>
          <AdminLogin demoPassword={isDemoLogin() ? DEMO_PASSWORD : null} />
        </Suspense>
      </div>
    </div>
  );
}
