// Shared class names for buttons and form fields used across the help, tracking,
// returns and account pages.

export const btnPrimary =
  "inline-flex min-h-[52px] cursor-pointer items-center justify-center gap-2.5 bg-emerald px-6 text-sm tracking-[0.12em] text-white uppercase disabled:cursor-wait disabled:opacity-70";
export const btnSecondary =
  "inline-flex min-h-[52px] cursor-pointer items-center justify-center gap-2.5 border border-charcoal px-6 text-sm tracking-[0.12em] text-charcoal uppercase";
export const btnSmall =
  "inline-flex min-h-11 cursor-pointer items-center justify-center border border-charcoal px-4 text-[13px] tracking-[0.08em] text-charcoal uppercase";
export const fieldLabel = "mb-1.5 block text-sm font-medium";
export const fieldInput =
  "min-h-12 w-full border bg-white px-3.5 text-base text-charcoal placeholder:text-muted-dark focus:outline-2 focus:outline-offset-0 focus:outline-charcoal";
export const fieldBorder = (error?: string) => (error ? "border-rust" : "border-line-strong");
export const sectionTitle = "mb-4 text-sm tracking-[0.12em] uppercase";
export const pageTitle = "font-serif text-[44px] leading-tight font-medium sm:text-[52px]";
