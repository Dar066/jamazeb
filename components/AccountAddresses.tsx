"use client";

import { useState, type FormEvent } from "react";
import { useHydrated } from "@/lib/local-store";
import { makeDefaultAddress, removeAddress, saveAddress, useProfile, type SavedAddress } from "@/lib/profile-store";
import { shipping } from "@/lib/shipping";
import { LIMITS } from "@/lib/validation";
import { btnPrimary, btnSecondary, btnSmall, fieldBorder, fieldInput, fieldLabel } from "./ui";

type Draft = Omit<SavedAddress, "id"> & { id?: string };
const blank: Draft = { label: "", name: "", city: "", address: "", notes: "" };
type Errors = Partial<Record<"name" | "city" | "address", string>>;

export function AccountAddresses() {
  const { addresses, name } = useProfile();
  const hydrated = useHydrated();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  if (!hydrated) return <div aria-busy="true" className="min-h-[50vh]" />;

  function startNew() {
    setErrors({});
    setDraft({ ...blank, name });
  }

  function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const found: Errors = {};
    if (draft.name.trim().length < 3) found.name = "Enter the full name for delivery.";
    if (!shipping.cities.includes(draft.city)) found.city = "Choose a city.";
    if (draft.address.trim().length < 8) found.address = "Enter house, street and area.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    saveAddress({ ...draft, label: draft.label.trim() || "Address", name: draft.name.trim(), address: draft.address.trim(), notes: draft.notes.trim() });
    setDraft(null);
  }

  const set = (key: keyof Draft) => (e: { target: { value: string } }) => {
    setDraft((d) => (d ? { ...d, [key]: e.target.value } : d));
    if (key in errors) setErrors((x) => ({ ...x, [key]: undefined }));
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-[40px] leading-tight font-medium">Saved addresses</h1>
      <p className="text-[15px] text-muted">Your default address is filled in for you at checkout.</p>

      {addresses.length > 0 && (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {addresses.map((a, i) => (
            <li key={a.id} className={`flex flex-col gap-2 border bg-white p-5 text-[15px] ${i === 0 ? "border-charcoal" : "border-line"}`}>
              <p className="font-medium">
                {a.label} {i === 0 && <span className="ml-1.5 bg-emerald-soft px-2 py-0.5 text-xs text-emerald">Default</span>}
              </p>
              <p>{a.name}</p>
              <p className="text-muted">
                {a.address}, {a.city}
              </p>
              {a.notes && <p className="text-sm text-muted">Note: {a.notes}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => { setErrors({}); setDraft(a); }} className={btnSmall} aria-label={`Edit ${a.label}`}>
                  Edit
                </button>
                {i > 0 && (
                  <button type="button" onClick={() => makeDefaultAddress(a.id)} className={btnSmall} aria-label={`Make ${a.label} the default`}>
                    Make default
                  </button>
                )}
                <button type="button" onClick={() => removeAddress(a.id)} className={btnSmall} aria-label={`Remove ${a.label}`}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {draft ? (
        <form onSubmit={handleSave} noValidate className="flex max-w-[640px] flex-col gap-4 border border-line bg-white p-6">
          <h2 className="text-lg font-medium">{draft.id ? "Edit address" : "New address"}</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <div>
              <label htmlFor="a-label" className={fieldLabel}>
                Label <span className="font-normal text-muted">(e.g. Home, Office)</span>
              </label>
              <input id="a-label" maxLength={30} value={draft.label} onChange={set("label")} className={`${fieldInput} ${fieldBorder()}`} />
            </div>
            <div>
              <label htmlFor="a-name" className={fieldLabel}>
                Full name
              </label>
              <input
                id="a-name"
                autoComplete="name"
                maxLength={LIMITS.name}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? "a-name-error" : undefined}
                value={draft.name}
                onChange={set("name")}
                className={`${fieldInput} ${fieldBorder(errors.name)}`}
              />
              {errors.name && <p id="a-name-error" className="mt-1.5 text-sm text-rust">{errors.name}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="a-city" className={fieldLabel}>
              City
            </label>
            <select
              id="a-city"
              aria-invalid={errors.city ? true : undefined}
              aria-describedby={errors.city ? "a-city-error" : undefined}
              value={draft.city}
              onChange={set("city")}
              className={`${fieldInput} ${fieldBorder(errors.city)}`}
            >
              <option value="">Choose city</option>
              {shipping.cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            {errors.city && <p id="a-city-error" className="mt-1.5 text-sm text-rust">{errors.city}</p>}
          </div>
          <div>
            <label htmlFor="a-address" className={fieldLabel}>
              Address
            </label>
            <input
              id="a-address"
              autoComplete="street-address"
              placeholder="House, street, area"
              maxLength={LIMITS.address}
              aria-invalid={errors.address ? true : undefined}
              aria-describedby={errors.address ? "a-address-error" : undefined}
              value={draft.address}
              onChange={set("address")}
              className={`${fieldInput} ${fieldBorder(errors.address)}`}
            />
            {errors.address && <p id="a-address-error" className="mt-1.5 text-sm text-rust">{errors.address}</p>}
          </div>
          <div>
            <label htmlFor="a-notes" className={fieldLabel}>
              Landmark or note for rider <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="a-notes" maxLength={LIMITS.notes} value={draft.notes} onChange={set("notes")} className={`${fieldInput} ${fieldBorder()}`} />
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className={btnPrimary}>
              Save address
            </button>
            <button type="button" onClick={() => setDraft(null)} className={btnSecondary}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={startNew} className={`${btnSecondary} self-start`}>
          + Add new address
        </button>
      )}
    </div>
  );
}
