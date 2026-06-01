/**
 * ACM Locations — Shared location hierarchy for RE/MAX Altitud ecosystem.
 *
 * Source of truth: ALTITUD HUB locations.js
 * Structure: Cantón → Distrito → Poblado/Barrio
 *
 * This module is used by:
 * - Sync pipeline (resolveSubLocation) to auto-tag properties on ingest
 * - Search combobox (AreaSearchCombobox) for hierarchical area selection
 * - Property cards (getPropertyLocation) for display labels
 *
 * When RECONNECT API sends Location = "Cajón de Pérez Zeledón, San José",
 * we match "Cajón" → district slug "cajon" under parent "perez-zeledon".
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface District {
  /** URL-safe slug for the district (e.g. "cajon") */
  slug: string;
  /** Display label (e.g. "Cajón") */
  label: string;
  /** Parent area slug this district belongs to (e.g. "perez-zeledon") */
  parentSlug: string;
  /** Coordinates [lat, lng, zoom] for map centering */
  coords?: [number, number, number];
}

export interface Canton {
  /** Display label (e.g. "Pérez Zeledón") */
  label: string;
  /** Area slug used in the website (e.g. "perez-zeledon") */
  areaSlug: string;
  /** Districts within this cantón */
  districts: District[];
}

// ─── Pérez Zeledón — 12 Districts ───────────────────────────────────────────

const PZ_DISTRICTS: District[] = [
  {
    slug: "san-isidro",
    label: "San Isidro de El General",
    parentSlug: "perez-zeledon",
    coords: [9.3787, -83.7008, 14],
  },
  {
    slug: "el-general",
    label: "El General",
    parentSlug: "perez-zeledon",
    coords: [9.355, -83.655, 14],
  },
  {
    slug: "daniel-flores",
    label: "Daniel Flores",
    parentSlug: "perez-zeledon",
    coords: [9.345, -83.68, 14],
  },
  { slug: "rivas", label: "Rivas", parentSlug: "perez-zeledon", coords: [9.465, -83.685, 13] },
  {
    slug: "san-pedro",
    label: "San Pedro",
    parentSlug: "perez-zeledon",
    coords: [9.315, -83.63, 13],
  },
  {
    slug: "platanares",
    label: "Platanares",
    parentSlug: "perez-zeledon",
    coords: [9.31, -83.72, 13],
  },
  { slug: "pejibaye", label: "Pejibaye", parentSlug: "perez-zeledon", coords: [9.28, -83.59, 13] },
  { slug: "cajon", label: "Cajón", parentSlug: "perez-zeledon", coords: [9.22, -83.61, 13] },
  { slug: "baru", label: "Barú", parentSlug: "perez-zeledon", coords: [9.29, -83.81, 13] },
  {
    slug: "rio-nuevo",
    label: "Río Nuevo",
    parentSlug: "perez-zeledon",
    coords: [9.305, -83.77, 13],
  },
  { slug: "paramo", label: "Páramo", parentSlug: "perez-zeledon", coords: [9.51, -83.72, 13] },
  {
    slug: "la-amistad",
    label: "La Amistad",
    parentSlug: "perez-zeledon",
    coords: [9.31, -83.52, 12],
  },
];

// ─── Osa (Dominical–Uvita) — 6 Districts ───────────────────────────────────

const OSA_DISTRICTS: District[] = [
  {
    slug: "bahia-ballena",
    label: "Bahía Ballena",
    parentSlug: "dominical",
    coords: [9.155, -83.745, 14],
  },
  {
    slug: "puerto-cortes",
    label: "Puerto Cortés",
    parentSlug: "ojochal",
    coords: [8.96, -83.53, 13],
  },
  { slug: "palmar", label: "Palmar", parentSlug: "ojochal", coords: [8.95, -83.47, 13] },
  { slug: "sierpe", label: "Sierpe", parentSlug: "ojochal", coords: [8.87, -83.48, 13] },
  {
    slug: "piedras-blancas",
    label: "Piedras Blancas",
    parentSlug: "ojochal",
    coords: [8.78, -83.35, 13],
  },
  { slug: "bahia-drake", label: "Bahía Drake", parentSlug: "ojochal", coords: [8.7, -83.55, 13] },
];

// ─── Quepos — 4 Districts ───────────────────────────────────────────────────

const QUEPOS_DISTRICTS: District[] = [
  { slug: "quepos-centro", label: "Quepos", parentSlug: "quepos", coords: [9.431, -84.162, 14] },
  { slug: "savegre", label: "Savegre", parentSlug: "quepos", coords: [9.32, -83.91, 13] },
  { slug: "naranjito", label: "Naranjito", parentSlug: "quepos", coords: [9.41, -84.07, 13] },
  {
    slug: "manuel-antonio",
    label: "Manuel Antonio",
    parentSlug: "quepos",
    coords: [9.392, -84.14, 14],
  },
];

// ─── Full Canton Registry ───────────────────────────────────────────────────

export const ACM_CANTONS: Canton[] = [
  {
    label: "Pérez Zeledón",
    areaSlug: "perez-zeledon",
    districts: PZ_DISTRICTS,
  },
  {
    label: "Osa (Dominical–Uvita)",
    areaSlug: "dominical",
    districts: OSA_DISTRICTS,
  },
  {
    label: "Quepos",
    areaSlug: "quepos",
    districts: QUEPOS_DISTRICTS,
  },
];

// ─── Exports for convenience ────────────────────────────────────────────────

/** All districts across all cantons */
export const ALL_DISTRICTS: District[] = ACM_CANTONS.flatMap((c) => c.districts);

/** Quick slug → District lookup */
export const DISTRICT_BY_SLUG: Record<string, District> = Object.fromEntries(
  ALL_DISTRICTS.map((d) => [d.slug, d]),
);

/** Get display label for a district slug, or title-case fallback */
export function getDistrictLabel(slug: string): string {
  const d = DISTRICT_BY_SLUG[slug];
  if (d) return d.label;
  // Fallback: title-case the slug
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Get parent area slug for a district */
export function getDistrictParent(slug: string): string | null {
  return DISTRICT_BY_SLUG[slug]?.parentSlug ?? null;
}

// ─── Keyword Matching (for resolving API Location strings) ──────────────────

/**
 * Maps keyword strings → district slugs for text-based resolution.
 * Ordered longest-first so "San Isidro de El General" matches before "San Isidro".
 */
export const DISTRICT_KEYWORDS: { keyword: string; slug: string; parent: string }[] = [
  // PZ — longest first
  { keyword: "san isidro de el general", slug: "san-isidro", parent: "perez-zeledon" },
  { keyword: "san gerardo de rivas", slug: "rivas", parent: "perez-zeledon" },
  { keyword: "daniel flores", slug: "daniel-flores", parent: "perez-zeledon" },
  { keyword: "general viejo", slug: "el-general", parent: "perez-zeledon" },
  { keyword: "río nuevo", slug: "rio-nuevo", parent: "perez-zeledon" },
  { keyword: "rio nuevo", slug: "rio-nuevo", parent: "perez-zeledon" },
  { keyword: "la amistad", slug: "la-amistad", parent: "perez-zeledon" },
  { keyword: "san gerardo", slug: "rivas", parent: "perez-zeledon" },
  { keyword: "san isidro", slug: "san-isidro", parent: "perez-zeledon" },
  { keyword: "el general", slug: "el-general", parent: "perez-zeledon" },
  { keyword: "san pedro", slug: "san-pedro", parent: "perez-zeledon" },
  { keyword: "platanares", slug: "platanares", parent: "perez-zeledon" },
  { keyword: "tinamastes", slug: "baru", parent: "perez-zeledon" },
  { keyword: "tinamaste", slug: "baru", parent: "perez-zeledon" },
  { keyword: "pejibaye", slug: "pejibaye", parent: "perez-zeledon" },
  { keyword: "chimirol", slug: "rivas", parent: "perez-zeledon" },
  { keyword: "páramo", slug: "paramo", parent: "perez-zeledon" },
  { keyword: "paramo", slug: "paramo", parent: "perez-zeledon" },
  { keyword: "cajón", slug: "cajon", parent: "perez-zeledon" },
  { keyword: "cajon", slug: "cajon", parent: "perez-zeledon" },
  { keyword: "rivas", slug: "rivas", parent: "perez-zeledon" },
  { keyword: "barú", slug: "baru", parent: "perez-zeledon" },
  { keyword: "baru", slug: "baru", parent: "perez-zeledon" },
  // Osa
  { keyword: "bahía ballena", slug: "bahia-ballena", parent: "dominical" },
  { keyword: "bahia ballena", slug: "bahia-ballena", parent: "dominical" },
  { keyword: "puerto cortés", slug: "puerto-cortes", parent: "ojochal" },
  { keyword: "puerto cortes", slug: "puerto-cortes", parent: "ojochal" },
  { keyword: "piedras blancas", slug: "piedras-blancas", parent: "ojochal" },
  { keyword: "bahía drake", slug: "bahia-drake", parent: "ojochal" },
  { keyword: "bahia drake", slug: "bahia-drake", parent: "ojochal" },
  { keyword: "sierpe", slug: "sierpe", parent: "ojochal" },
  { keyword: "palmar", slug: "palmar", parent: "ojochal" },
  // Quepos
  { keyword: "manuel antonio", slug: "manuel-antonio", parent: "quepos" },
  { keyword: "naranjito", slug: "naranjito", parent: "quepos" },
  { keyword: "savegre", slug: "savegre", parent: "quepos" },
];
