/**
 * Shared SEO constants — Task 9 (Story 4.4)
 * Single source of truth for site origin and supported locales.
 *
 * NOT "server-only" — safe to import in both server and client bundles
 * since these are public domain constants.
 */

export const SITE_ORIGIN = "https://remax-altitud.cr";
export const LOCALES = ["en", "es"] as const;
