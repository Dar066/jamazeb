/** Formats a whole-rupee amount as "Rs 4,950". */
export function formatPrice(amount: number): string {
  return `Rs ${Math.round(amount).toLocaleString("en-US")}`;
}

/** "6 October" (or "6 October 2025" when not this year), in Pakistan time. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "Asia/Karachi",
  });
}
