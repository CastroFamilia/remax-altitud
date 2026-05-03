/**
 * hreflang and canonical URL helpers — Task 2 (Story 4.4)
 *
 * Runs server-side only.
 * SITE_ORIGIN and LOCALES are imported from constants.ts (single source of truth).
 */

import "server-only";

import { SITE_ORIGIN, LOCALES } from "@/lib/seo/constants";

/**
 * Generates hreflang alternate language entries for all supported locales.
 * path should be the locale-agnostic path, e.g. "/property/beautiful-home"
 * or "/agents/emma-smith".
 *
 * Required by test 4.4-UNIT-004: must produce both
 *   { hrefLang: 'en', href: '…/en/property/…' } and
 *   { hrefLang: 'es', href: '…/es/property/…' } entries.
 */
export function generateAlternateLanguages(path: string): { hrefLang: string; href: string }[] {
  // Phase 2: add it, de, fr, pt
  return LOCALES.map((locale) => ({
    hrefLang: locale,
    href: `${SITE_ORIGIN}/${locale}${path}`,
  }));
}

/**
 * Generates an absolute canonical URL for <link rel="canonical">.
 * path is the locale-agnostic path, e.g. "/property/beautiful-home"
 */
export function generateCanonicalUrl(locale: string, path: string): string {
  return `${SITE_ORIGIN}/${locale}${path}`;
}

/**
 * Returns the `alternates` field shape compatible with Next.js `Metadata` type.
 * Used by Next.js App Router `generateMetadata` to auto-emit
 * `<link rel="alternate" hreflang="...">` tags in <head>.
 *
 * Spread into `alternates` alongside `canonical`:
 *   alternates: {
 *     canonical: generateCanonicalUrl(locale, path),
 *     ...buildAlternatesMetadata(path),
 *   }
 */
export function buildAlternatesMetadata(path: string): { languages: Record<string, string> } {
  return {
    languages: Object.fromEntries(
      generateAlternateLanguages(path).map(({ hrefLang, href }) => [hrefLang, href]),
    ),
  };
}
