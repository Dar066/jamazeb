"use client";

import { useSyncExternalStore } from "react";

/**
 * A tiny store saved in the visitor's browser (localStorage), shared by every
 * component that uses it and kept in sync across open tabs. Used for the cart,
 * wishlist and order history until accounts move to a database.
 */
export function createLocalStore<T>(key: string, empty: T, isValid: (value: unknown) => boolean) {
  let value = empty;
  let loaded = false;
  const listeners = new Set<() => void>();

  function load() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isValid(parsed)) value = parsed as T;
      }
    } catch {
      // Unreadable or blocked storage: start empty.
    }
  }

  function get(): T {
    load();
    return value;
  }

  function set(next: T) {
    loaded = true;
    value = next;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Private browsing or full storage: keeps working for this visit only.
    }
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    load();
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      loaded = false;
      value = empty;
      load();
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function useValue(): T {
    return useSyncExternalStore(subscribe, get, () => empty);
  }

  return { get, set, useValue };
}

const noop = () => () => {};

/** False during the server render and first paint, true once browser data can be read. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
