/**
 * Unit conversion utilities for area measurements.
 * Supports metric (m²/hectares) and imperial (ft²/acres) systems.
 *
 * Architecture §3: Pure utility — no 'use client' / no 'use server'
 * Story 3.7 — AC #1, #2, #3, #4
 */

export type UnitSystem = "metric" | "imperial";

// ---------------------------------------------------------------------------
// Conversion constants (R-014 — exact values required for test assertions)
// ---------------------------------------------------------------------------

/** 1 m² = 10.7639 ft² */
export const SQFT_PER_M2 = 10.7639;

/** 1 acre = 4046.86 m² */
export const M2_PER_ACRE = 4046.86;

/** 1 ha = 10000 m² */
export const M2_PER_HA = 10000;

/**
 * Detect the default unit system from a locale string.
 *
 * Project locales are 'en' and 'es' only (src/i18n/routing.ts).
 * Browser locale may return 'en-US', 'de-DE', etc.
 *
 * - 'en' or any 'en-*' prefix → imperial (US/Canadian buyer audience)
 * - All others (e.g., 'es', 'de-DE') → metric
 */
export function detectDefaultUnitSystem(locale: string): UnitSystem {
  return locale === "en" || locale.startsWith("en-") ? "imperial" : "metric";
}

/**
 * Convert an area in m² to a locale-formatted string in the given unit system.
 *
 * Metric path:
 *   - m² >= 10,000 → display as hectares (1 ha = 10,000 m²)
 *   - else → display as m²
 *
 * Imperial path:
 *   - m² >= 40,468.6 (≈ 10 acres) → display as acres (1 acre = 4046.86 m²)
 *   - else → display as ft² (1 m² = 10.7639 ft²)
 *
 * Returns formatted strings like: "1.5 ha", "350 m²", "2.3 acres", "3,767 ft²"
 */
export function convertArea(m2: number, system: UnitSystem): string {
  if (system === "metric") {
    if (m2 >= M2_PER_HA) {
      const ha = m2 / M2_PER_HA;
      // Format to 1 decimal place, strip trailing zero if integer
      const formatted = Number.isInteger(ha) ? String(ha) : ha.toFixed(1);
      return `${formatted} ha`;
    }
    return `${Math.round(m2)} m²`;
  }

  // Imperial
  const ACRE_THRESHOLD = M2_PER_ACRE * 10; // 10 acres = 40468.6 m²
  if (m2 >= ACRE_THRESHOLD) {
    const acres = m2 / M2_PER_ACRE;
    const formatted = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 1,
    }).format(acres);
    return `${formatted} acres`;
  }

  const sqft = m2 * SQFT_PER_M2;
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(sqft);
  return `${formatted} ft²`;
}
