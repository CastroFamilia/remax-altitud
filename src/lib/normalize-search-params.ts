/**
 * Normalize search URL parameters — accent-insensitive, case-insensitive,
 * space-tolerant slug resolution for area and sub-location filters.
 *
 * Converts raw user input (from URL params, manual entry, shared links) into
 * canonical database slugs so that "Pérez Zeledón", "Perez Zeledon",
 * "PEREZ-ZELEDON", etc. all resolve to "perez-zeledon".
 */

/**
 * Strip diacritics / combining marks from a string.
 * "Pérez Zeledón" → "Perez Zeledon"
 */
export function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Convert raw text into a URL-style slug.
 * Lowercases, strips accents, replaces spaces/underscores with hyphens,
 * collapses multiple hyphens, trims leading/trailing hyphens.
 */
function toSlug(raw: string): string {
  return stripDiacritics(raw)
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-") // spaces / underscores → hyphen
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens
}

// ── Canonical area slug lookup ──────────────────────────────────────────────
// Maps every known variant (slugified) → canonical DB slug.
// Built from the same dictionaries used in hero-search-shell.tsx AREA_KEYWORDS
// plus display labels from AREA_LABELS.
const AREA_SLUG_ALIASES: Record<string, string> = {
  // Canonical slugs (identity)
  "perez-zeledon": "perez-zeledon",
  uvita: "uvita",
  dominical: "dominical",
  ojochal: "ojochal",
  quepos: "quepos",
  "manuel-antonio": "manuel-antonio",
  jaco: "jaco",
  tamarindo: "tamarindo",
  nosara: "nosara",
  samara: "samara",
  "santa-teresa": "santa-teresa",
  "playa-hermosa": "playa-hermosa",
  "tinamastes-platanillo": "tinamastes-platanillo",
  // Abbreviations / common aliases
  pz: "perez-zeledon",
  // Sub-district names that map to perez-zeledon as area
  "san-isidro": "perez-zeledon",
  "san-isidro-de-el-general": "perez-zeledon",
  cajon: "perez-zeledon",
  rivas: "perez-zeledon",
  "daniel-flores": "perez-zeledon",
  pejibaye: "perez-zeledon",
  "general-viejo": "perez-zeledon",
  "san-gerardo": "perez-zeledon",
  "san-gerardo-de-rivas": "perez-zeledon",
  platanares: "perez-zeledon",
  // Barú / Tinamastes aliases
  tinamastes: "tinamastes-platanillo",
  platanillo: "tinamastes-platanillo",
  baru: "tinamastes-platanillo",
};

// ── Canonical sub-location slug lookup ──────────────────────────────────────
const SUB_LOCATION_SLUG_ALIASES: Record<string, string> = {
  // Canonical slugs (identity)
  "san-isidro": "san-isidro",
  "el-general": "el-general",
  "daniel-flores": "daniel-flores",
  rivas: "rivas",
  "san-pedro": "san-pedro",
  platanares: "platanares",
  pejibaye: "pejibaye",
  cajon: "cajon",
  baru: "baru",
  "rio-nuevo": "rio-nuevo",
  paramo: "paramo",
  "la-amistad": "la-amistad",
  // Accented display-label variants (after slug normalization)
  "san-isidro-de-el-general": "san-isidro",
  "general-viejo": "el-general",
  "san-gerardo": "rivas",
  "san-gerardo-de-rivas": "rivas",
};

/**
 * Normalize a raw area value from URL params to its canonical DB slug.
 *
 * Examples:
 *   "Pérez Zeledón"  → "perez-zeledon"
 *   "Perez Zeledon"  → "perez-zeledon"
 *   "PEREZ-ZELEDON"  → "perez-zeledon"
 *   "Manuel Antonio" → "manuel-antonio"
 *   "perez-zeledon"  → "perez-zeledon" (no-op)
 */
export function normalizeAreaSlug(raw: string): string {
  const slugified = toSlug(raw);

  // Direct alias lookup
  if (AREA_SLUG_ALIASES[slugified]) {
    return AREA_SLUG_ALIASES[slugified];
  }

  // Already a valid-looking slug, return as-is (handles unknown future areas)
  return slugified;
}

/**
 * Normalize a raw sub-location value from URL params to its canonical DB slug.
 *
 * Examples:
 *   "San Isidro"     → "san-isidro"
 *   "Daniel Flores"  → "daniel-flores"
 *   "Río Nuevo"      → "rio-nuevo"
 *   "rio-nuevo"      → "rio-nuevo" (no-op)
 */
export function normalizeSubLocation(raw: string): string {
  const slugified = toSlug(raw);

  // Direct alias lookup
  if (SUB_LOCATION_SLUG_ALIASES[slugified]) {
    return SUB_LOCATION_SLUG_ALIASES[slugified];
  }

  // Already a valid-looking slug, return as-is
  return slugified;
}
