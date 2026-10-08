"use client";

import { useState } from "react";

/** Newsletter sign-up. Saving to a list is connected in a later phase. */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "invalid" | "done">("idle");

  if (state === "done") {
    return (
      <p role="status" className="mt-2 bg-emerald-soft px-5 py-3.5 text-emerald">
        Thank you for subscribing. New drops will reach you first.
      </p>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setState(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "done" : "invalid");
      }}
      className="mt-2 flex w-full flex-wrap justify-center gap-3"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        autoComplete="email"
        placeholder="Your email address"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (state === "invalid") setState("idle");
        }}
        aria-invalid={state === "invalid"}
        aria-describedby={state === "invalid" ? "newsletter-error" : undefined}
        className="min-h-12 flex-[1_1_280px] border border-line-strong bg-white px-4 text-[15px]"
      />
      <button
        type="submit"
        className="min-h-12 cursor-pointer bg-charcoal px-7 text-sm tracking-[0.12em] text-ivory uppercase"
      >
        Subscribe
      </button>
      {state === "invalid" && (
        <p id="newsletter-error" role="alert" className="w-full text-sm text-rust">
          Please enter a valid email address.
        </p>
      )}
    </form>
  );
}
