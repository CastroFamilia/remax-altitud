/**
 * Lifestyle tag definitions and auto-tagging rules.
 * Used by src/lib/sync/lifestyle-tagger.ts and (in Epic 3) by Client Components
 * for filter UI — therefore this file must NOT have "server-only" or "use client".
 *
 * Architecture §3: src/lib/constants/lifestyle-tags.ts — "Tag definitions + auto-tag rules"
 * AC #1, #2, #3, #4, #5, #6 — FR49 lifestyle auto-tagging
 */

import type { RawProperty } from "@/types/remax-api";

/**
 * All valid lifestyle tag names.
 * DO NOT hardcode these strings anywhere else — import LifestyleTag as the type.
 */
export const LIFESTYLE_TAGS = [
  "Rental Potential",
  "Investment Property",
  "Vacation Home",
  "Retire",
  "Commercial",
] as const;

/** Union type of all valid lifestyle tag strings. */
export type LifestyleTag = (typeof LIFESTYLE_TAGS)[number];

/**
 * A single auto-tagging rule.
 * Rules are pure data: adding a new rule requires only adding one object here —
 * zero other code changes (AC #6).
 */
export interface LifestyleTagRule {
  tag: LifestyleTag;
  match: (raw: RawProperty) => boolean;
}

/**
 * All auto-tagging rules.
 * Architecture §5 Step 6 mandates at least these three rules.
 * Extend by appending new LifestyleTagRule objects — no other changes needed.
 */
export const LIFESTYLE_TAG_RULES: LifestyleTagRule[] = [
  {
    // AC #2 — Condo in tourist zone → "Rental Potential"
    // Architecture §5: check propertyTypeEn for "condo" (case-insensitive)
    tag: "Rental Potential",
    match: (raw) => raw.propertyTypeEn.toLowerCase().includes("condo"),
  },
  {
    // AC #3 — Large lot (propertyTypeEn includes "land" or "lot") AND lotSizeM2 >= 5000
    tag: "Investment Property",
    match: (raw) =>
      (raw.propertyTypeEn.toLowerCase().includes("land") ||
        raw.propertyTypeEn.toLowerCase().includes("lot")) &&
      (raw.lotSizeM2 ?? 0) >= 5000,
  },
  {
    // AC #4 — "retirement" in description (case-insensitive) → "Retire"
    // Architecture §5 example: "House with 'retirement' in description → 'Retire'"
    tag: "Retire",
    match: (raw) => (raw.publicRemarksEn ?? "").toLowerCase().includes("retirement"),
  },
];
