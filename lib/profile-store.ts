"use client";

import { createLocalStore } from "./local-store";

// The shopper's saved details and addresses on this device. Used to fill in
// checkout. Moves to a signed-in account in Phase 6.

export type SavedAddress = { id: string; label: string; name: string; city: string; address: string; notes: string };

export type Profile = {
  name: string;
  phone: string;
  email: string;
  whatsappUpdates: boolean;
  /** New collections and sale alerts. */
  alerts: boolean;
  /** The first address is the default. */
  addresses: SavedAddress[];
};

export const emptyProfile: Profile = { name: "", phone: "", email: "", whatsappUpdates: true, alerts: false, addresses: [] };

const store = createLocalStore<Profile>(
  "jamazeb-profile",
  emptyProfile,
  (v) => typeof v === "object" && v !== null && Array.isArray((v as Profile).addresses),
);

export const useProfile = store.useValue;
export const getProfile = store.get;

export function saveProfile(change: Partial<Profile>) {
  store.set({ ...store.get(), ...change });
}

export function saveAddress(address: Omit<SavedAddress, "id"> & { id?: string }) {
  const list = store.get().addresses;
  const id = address.id || `a${Date.now().toString(36)}`;
  const entry = { ...address, id };
  saveProfile({ addresses: list.some((a) => a.id === id) ? list.map((a) => (a.id === id ? entry : a)) : [...list, entry] });
}

export function removeAddress(id: string) {
  saveProfile({ addresses: store.get().addresses.filter((a) => a.id !== id) });
}

export function makeDefaultAddress(id: string) {
  const list = store.get().addresses;
  const chosen = list.find((a) => a.id === id);
  if (chosen) saveProfile({ addresses: [chosen, ...list.filter((a) => a.id !== id)] });
}
