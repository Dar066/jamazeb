// Checkout validation shared by the browser (instant feedback) and the server
// (the rules that actually decide). Keep both sides using these functions.

/** Normalises a Pakistani mobile number to 03XXXXXXXXX, or returns null if invalid. */
export function normalizePkMobile(input: string): string | null {
  let digits = input.replace(/[^0-9]/g, "");
  if (digits.startsWith("92") && digits.length === 12) digits = "0" + digits.slice(2);
  return /^03[0-9]{9}$/.test(digits) ? digits : null;
}

export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.trim());
}

export type CustomerInput = {
  phone: string;
  email: string;
  name: string;
  city: string;
  address: string;
  notes: string;
  whatsappUpdates: boolean;
};

export type CustomerErrors = Partial<Record<keyof CustomerInput, string>>;

export const LIMITS = { name: 80, address: 200, notes: 200, email: 120 } as const;

export function validateCustomer(c: CustomerInput, cities: readonly string[]): CustomerErrors {
  const errors: CustomerErrors = {};
  if (!normalizePkMobile(c.phone)) errors.phone = "Enter a mobile number like 0300 1234567.";
  if (c.email.trim() && !isValidEmail(c.email)) errors.email = "Enter a valid email, or leave it empty.";
  if (c.email.length > LIMITS.email) errors.email = "Email is too long.";
  if (c.name.trim().length < 3) errors.name = "Enter your full name.";
  if (c.name.length > LIMITS.name) errors.name = "Name is too long.";
  if (!cities.includes(c.city)) errors.city = "Choose your city.";
  if (c.address.trim().length < 8) errors.address = "Enter your house, street and area.";
  if (c.address.length > LIMITS.address) errors.address = "Address is too long.";
  if (c.notes.length > LIMITS.notes) errors.notes = "Note is too long.";
  return errors;
}
