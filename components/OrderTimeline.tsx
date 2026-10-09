import { FULFILMENT_STEPS, currentStep, stepTime } from "@/lib/fulfilment";
import { formatDate } from "@/lib/format";
import type { Order } from "@/lib/orders";

/** Vertical list of delivery steps, with the current one highlighted. */
export function OrderTimeline({ order }: { order: Order }) {
  const step = currentStep(order);
  const last = FULFILMENT_STEPS.length - 1;
  return (
    <ol className="flex flex-col">
      {FULFILMENT_STEPS.map((s, i) => {
        // The last step (Delivered) shows as done once reached; earlier current steps show as in progress.
        const done = i < step || (i === step && step === last);
        const current = i === step && !done;
        const reached = i <= step;
        const time = stepTime(order, i);
        return (
          <li key={s.label} className="relative flex gap-4 pb-7 last:pb-0" aria-current={i === step ? "step" : undefined}>
            {i < last && (
              <span
                aria-hidden="true"
                className={`absolute top-6 left-[11px] h-[calc(100%-24px)] w-0.5 ${i < step ? "bg-emerald" : "bg-line-strong"}`}
              />
            )}
            <span
              aria-hidden="true"
              className={`relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                reached ? "border-emerald" : "border-line-strong"
              } ${done ? "bg-emerald" : "bg-white"}`}
            >
              {done && (
                <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2.5 6.5l2.5 2.5 4.5-5" />
                </svg>
              )}
              {current && <span className="h-2 w-2 rounded-full bg-emerald" />}
            </span>
            <div className={reached ? "text-charcoal" : "text-muted"}>
              <p className={i === step ? "font-medium" : ""}>
                {s.label}
                <span className="sr-only">{done ? " (done)" : current ? " (current)" : " (upcoming)"}</span>
              </p>
              {reached && <p className="text-sm text-muted">{s.detail}</p>}
              {reached && time && <p className="text-sm text-muted">{formatDate(time)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
