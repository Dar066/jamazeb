/**
 * Serialises structured data for a <script type="application/ld+json"> tag.
 * Escapes "<" so product text can never close the script tag (XSS-safe).
 */
export function jsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
