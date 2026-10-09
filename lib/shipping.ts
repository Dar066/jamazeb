// Delivery is behind a ShippingProvider interface. The demo uses MockShipping;
// a real courier (PostEx, Trax, Leopards, M&P...) is another class with the
// same methods, chosen per client, with no changes to the pages.

export interface ShippingProvider {
  readonly name: string;
  /** Cities the store delivers to, as shown at checkout. */
  readonly cities: readonly string[];
  /** Delivery charge in rupees for a city. */
  getRate(city: string): number;
  /** Customer-facing delivery promise. */
  getEstimate(city: string): string;
}

const RATES: Record<string, number> = {
  Lahore: 200,
  Islamabad: 250,
  Rawalpindi: 250,
  Faisalabad: 250,
  Gujranwala: 250,
  Sialkot: 250,
  Karachi: 300,
  Multan: 300,
  Peshawar: 300,
  Hyderabad: 300,
  Quetta: 350,
  "Other city": 350,
};

class MockShipping implements ShippingProvider {
  readonly name = "Demo courier";
  readonly cities = Object.keys(RATES);

  getRate(city: string): number {
    return RATES[city] ?? RATES["Other city"];
  }

  getEstimate(): string {
    return "within 15 days";
  }
}

export const shipping: ShippingProvider = new MockShipping();
