"use client";

import { useState, type FormEvent } from "react";
import { useHydrated } from "@/lib/local-store";
import { getProfile, saveProfile, useProfile } from "@/lib/profile-store";
import { LIMITS, isValidEmail, normalizePkMobile } from "@/lib/validation";
import { btnPrimary, fieldBorder, fieldInput, fieldLabel } from "./ui";

type Errors = Partial<Record<"name" | "phone" | "email", string>>;

export function AccountProfile() {
  const hydrated = useHydrated();
  if (!hydrated) return <div aria-busy="true" className="min-h-[50vh]" />;
  return <ProfileForm />;
}

function ProfileForm() {
  // Saved values are read once when the form opens; edits stay local until saved.
  const [form, setForm] = useState(() => getProfile());
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);
  useProfile(); // re-render if another tab changes the profile

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const found: Errors = {};
    if (form.name.trim() && form.name.trim().length < 3) found.name = "Enter your full name.";
    const phone = form.phone.trim() ? normalizePkMobile(form.phone) : "";
    if (phone === null) found.phone = "Enter a mobile number like 0300 1234567.";
    if (form.email.trim() && !isValidEmail(form.email)) found.email = "Enter a valid email, or leave it empty.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    saveProfile({ name: form.name.trim(), phone: phone ?? "", email: form.email.trim(), whatsappUpdates: form.whatsappUpdates, alerts: form.alerts });
    setForm((f) => ({ ...f, phone: phone ?? "" }));
    setSaved(true);
  }

  const err = (key: keyof Errors) => errors[key] && <p id={`p-${key}-error`} className="mt-1.5 text-sm text-rust">{errors[key]}</p>;
  const a11y = (key: keyof Errors) => ({
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `p-${key}-error` : undefined,
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-[640px] flex-col gap-5">
      <h1 className="font-serif text-[40px] leading-tight font-medium">Profile</h1>
      <p className="text-[15px] text-muted">These details are filled in for you at checkout.</p>
      <div>
        <label htmlFor="p-name" className={fieldLabel}>
          Full name
        </label>
        <input id="p-name" autoComplete="name" maxLength={LIMITS.name} {...a11y("name")} value={form.name} onChange={(e) => update("name", e.target.value)} className={`${fieldInput} ${fieldBorder(errors.name)}`} />
        {err("name")}
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <div>
          <label htmlFor="p-phone" className={fieldLabel}>
            Mobile number
          </label>
          <input id="p-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0300 1234567" {...a11y("phone")} value={form.phone} onChange={(e) => update("phone", e.target.value)} className={`${fieldInput} ${fieldBorder(errors.phone)}`} />
          {err("phone")}
        </div>
        <div>
          <label htmlFor="p-email" className={fieldLabel}>
            Email <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id="p-email" type="email" autoComplete="email" maxLength={LIMITS.email} {...a11y("email")} value={form.email} onChange={(e) => update("email", e.target.value)} className={`${fieldInput} ${fieldBorder(errors.email)}`} />
          {err("email")}
        </div>
      </div>
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-medium">Messages</legend>
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input type="checkbox" checked={form.whatsappUpdates} onChange={(e) => update("whatsappUpdates", e.target.checked)} className="h-5 w-5 accent-emerald" />
          Order updates on WhatsApp
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input type="checkbox" checked={form.alerts} onChange={(e) => update("alerts", e.target.checked)} className="h-5 w-5 accent-emerald" />
          New collections and sale alerts
        </label>
      </fieldset>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className={btnPrimary}>
          Save changes
        </button>
        <p role="status" className="text-sm text-emerald">
          {saved ? "Changes saved" : ""}
        </p>
      </div>
    </form>
  );
}
