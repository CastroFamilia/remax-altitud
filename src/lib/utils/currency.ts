/**
 * Currency formatting utilities for USD → EUR conversion.
 * Uses a static approximate exchange rate (build-time constant).
 *
 * Architecture §5: USD-canonical pricing — All prices stored in USD.
 * Non-US locales show an approximate EUR conversion (FR10).
 *
 * Story 3.7 — AC #5, #7
 */

/**
 * Approximate USD → EUR exchange rate (2024–2025 static constant).
 * Per test-design §Assumptions: not a live API call — build-time static.
 */
export const EUR_RATE = 0.92;

/**
 * Format a USD price for the given locale using Intl.NumberFormat.
 *
 * Examples:
 *   formatUSD(185000, 'en-US') → "$185,000"
 *   formatUSD(185000, 'de-DE') → "185.000 $"
 */
export function formatUSD(price: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Convert a USD price to EUR and format for the given locale.
 *
 * Examples:
 *   formatEUR(185000, 'en-US') → "€170,200"
 */
export function formatEUR(price: number, locale: string): string {
  const eur = Math.round(price * EUR_RATE);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(eur);
}

/**
 * Returns true when the locale is NOT English (i.e., should show EUR conversion).
 *
 * Project locale 'en' and browser locale 'en-US' (or any 'en-*') → false (US audience)
 * All other locales (e.g., 'es', 'de-DE', 'fr-FR') → true
 *
 * Used by FR10: show approximate EUR for non-US locales.
 */
export function isNonUSLocale(locale: string): boolean {
  return locale !== "en" && !locale.startsWith("en-");
}
