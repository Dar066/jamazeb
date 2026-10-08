/** Formats a whole-rupee amount as "Rs 4,950". */
export function formatPrice(amount: number): string {
  return `Rs ${Math.round(amount).toLocaleString("en-US")}`;
}
