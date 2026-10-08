"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { whatsappLink } from "@/lib/site";
import { ChatIcon } from "./icons";

const chip =
  "inline-flex min-h-9 items-center border border-line-strong bg-white px-3 text-[13px] text-charcoal hover:border-charcoal";

/**
 * Floating WhatsApp chat. Opens a small panel with quick replies; the main
 * action hands the conversation to WhatsApp once a store number is configured.
 */
export function ChatWidget({ defaultMessage = "Hi, I have a question about one of your products." }: { defaultMessage?: string }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const link = whatsappLink(defaultMessage);

  // Close with Escape, as expected for a dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-label="Chat with Jamazeb"
          className="fixed right-6 bottom-24 z-20 flex w-[340px] max-w-[calc(100%-48px)] flex-col border border-line bg-white shadow-[0_12px_32px_rgba(0,0,0,0.16)]"
        >
          <div className="flex items-center justify-between bg-emerald py-2.5 pr-2 pl-4 text-white">
            <div>
              <p className="font-medium">Jamazeb</p>
              <p className="text-[13px]">Chat with us on WhatsApp</p>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="h-11 w-11 cursor-pointer text-2xl text-white"
            >
              ×
            </button>
          </div>
          <div className="flex flex-col gap-2.5 bg-stone p-4 text-sm">
            <p className="max-w-[85%] self-start bg-white px-3 py-2.5">Assalam o Alaikum! How can we help you today?</p>
          </div>
          <div className="flex flex-wrap gap-2 px-4 py-3">
            <Link href="/track" className={chip} onClick={() => setOpen(false)}>
              Track my order
            </Link>
            <Link href="/help/shipping" className={chip} onClick={() => setOpen(false)}>
              Size &amp; delivery help
            </Link>
          </div>
          <div className="px-4 pb-4">
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center justify-center bg-emerald text-sm tracking-[0.1em] text-white uppercase hover:text-white"
              >
                Continue on WhatsApp
              </a>
            ) : (
              <p className="text-xs text-[#6f6c65]">
                Demo store: add NEXT_PUBLIC_WHATSAPP_NUMBER to open a real WhatsApp chat.
              </p>
            )}
          </div>
        </div>
      )}
      <button
        type="button"
        aria-label="Chat with us on WhatsApp"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="fixed right-6 bottom-6 z-[21] flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-emerald text-white shadow-[0_6px_18px_rgba(0,0,0,0.18)]"
      >
        <ChatIcon />
      </button>
    </>
  );
}
