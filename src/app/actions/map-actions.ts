"use server";

/**
 * Story 3.2: Server Action — getPropertiesForMap
 *
 * Fetches visible properties with valid coordinates for the map.
 * Optionally filters by bounding box using PostGIS ST_MakeEnvelope.
 * Returns a max of 500 properties (spatial index idx_properties_geo is on geo column).
 *
 * Server Actions are reachable from the client — input is treated as untrusted.
 * `bounds` is sanitized before being passed to PostGIS:
 *   - All four sides must be finite numbers
 *   - lat clamped to [-90, 90], lng clamped to [-180, 180]
 *   - Inverted bounds (e.g. west > east) are rejected (returns no spatial filter)
 * Drizzle's sql template parameterizes the values so SQL injection is impossible
 * even if a value slips past validation.
 *
 * @see _bmad-output/implementation-artifacts/3-2-interactive-map-with-property-pins.md Task 8
 */

import { and, isNotNull, eq, gte, lte, inArray, sql, or } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { properties } from "@/lib/db/schema";
import { normalizePropertyImages } from "@/lib/utils/normalize-images";
import type { OptimizedImage } from "@/types/images";

export type MapProperty = {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  priceUsd: number;
  bedrooms: number | null;
  bathrooms: number | null;
  lotSizeM2: number | null;
  constructionM2: number | null;
  zmtStatus: string;
  propertyType: string;
  listingType: string;
  currency: string;
  apiRaw: unknown;
  images: OptimizedImage[];
  latitude: number;
  longitude: number;
};

type RawBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

/** Optional filters to apply to map property queries.
 * Mirrors SearchFilters from @/types/search so the map stays in sync with
 * the grid when any filter is active (not just type/listingType). */
export type MapFilters = {
  type?: string;
  listingType?: string;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  lotSizeMin?: number;
  lotSizeMax?: number;
  areaSlug?: string;
  subLocation?: string;
  tags?: string[];
  q?: string;
};

/**
 * Sanitize a numeric value — returns undefined if the value is not a finite,
 * non-negative number.
 */
function sanitizeNumber(value: number | undefined): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Number.isFinite(value)) return undefined;
  if (value < 0) return undefined;
  return value;
}

/**
 * Escapes special regex characters in a query token to prevent regex injection.
 */
function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * Maps a user-facing type label (Spanish or English) to all equivalent
 * property_type values stored in the DB. Mirrors the TYPE_EQUIVALENTS
 * in search-actions.ts so map and grid stay in sync.
 */
const TYPE_EQUIVALENTS: Record<string, string[]> = {
  casa: ["Casa", "House", "Residential", "House/Villa"],
  house: ["Casa", "House", "Residential", "House/Villa"],
  apartamento: ["Apartamento", "Apartment", "Condominium", "Condo"],
  apartment: ["Apartamento", "Apartment", "Condominium", "Condo"],
  lote: [
    "Lote",
    "Lot",
    "Land",
    "Lot/Land",
    "Terreno",
    "Terrenos",
    "Finca",
    "Farm",
    "Ranch",
    "Rural area",
  ],
  lot: [
    "Lote",
    "Lot",
    "Land",
    "Lot/Land",
    "Terreno",
    "Terrenos",
    "Finca",
    "Farm",
    "Ranch",
    "Rural area",
  ],
  terreno: [
    "Terreno",
    "Terrenos",
    "Land",
    "Lot",
    "Lot/Land",
    "Lote",
    "Finca",
    "Farm",
    "Ranch",
    "Rural area",
  ],
  comercial: ["Comercial", "Commercial", "Business"],
  commercial: ["Comercial", "Commercial", "Business"],
  finca: [
    "Finca",
    "Farm",
    "Ranch",
    "Rural area",
    "Lote",
    "Lot",
    "Land",
    "Lot/Land",
    "Terreno",
    "Terrenos",
  ],
  farm: [
    "Finca",
    "Farm",
    "Ranch",
    "Rural area",
    "Lote",
    "Lot",
    "Land",
    "Lot/Land",
    "Terreno",
    "Terrenos",
  ],
};

function getPropertyTypeEquivalents(type: string): string[] {
  const normalized = type.toLowerCase().trim();
  const equivalents = TYPE_EQUIVALENTS[normalized];
  if (equivalents) return equivalents;
  const capitalized = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  return [type, normalized, capitalized];
}

/**
 * Validates a client-supplied bounds object. Returns sanitized bounds when
 * valid, or null when the input fails any guard (caller falls back to the
 * unfiltered query).
 */
function sanitizeBounds(bounds: RawBounds): RawBounds | null {
  const { north, south, east, west } = bounds;

  // Must all be finite numbers (guards against NaN, Infinity, non-numbers
  // sneaking past TypeScript at the Server Action boundary).
  if (
    !Number.isFinite(north) ||
    !Number.isFinite(south) ||
    !Number.isFinite(east) ||
    !Number.isFinite(west)
  ) {
    return null;
  }

  // Clamp to valid Earth coordinates.
  const clampedNorth = Math.min(90, Math.max(-90, north));
  const clampedSouth = Math.min(90, Math.max(-90, south));
  const clampedEast = Math.min(180, Math.max(-180, east));
  const clampedWest = Math.min(180, Math.max(-180, west));

  // Reject inverted / degenerate envelopes.
  if (clampedNorth <= clampedSouth || clampedEast <= clampedWest) {
    return null;
  }

  return {
    north: clampedNorth,
    south: clampedSouth,
    east: clampedEast,
    west: clampedWest,
  };
}

export async function getPropertiesForMap(
  bounds?: RawBounds,
  filters?: MapFilters,
): Promise<MapProperty[]> {
  const baseConditions = and(
    eq(properties.isVisible, true),
    isNotNull(properties.latitude),
    isNotNull(properties.longitude),
  );

  const safeBounds = bounds != null ? sanitizeBounds(bounds) : null;

  // Build filter conditions from the active search filters so map pins
  // stay in sync with the card grid.
  const typeCondition = filters?.type
    ? inArray(properties.propertyType, getPropertyTypeEquivalents(filters.type))
    : undefined;

  const listingTypeCondition = filters?.listingType
    ? eq(properties.listingType, filters.listingType)
    : undefined;

  // Numeric filter conditions — mirror searchProperties logic
  const priceMin = sanitizeNumber(filters?.priceMin);
  const priceMax = sanitizeNumber(filters?.priceMax);
  const bedrooms = sanitizeNumber(filters?.bedrooms);
  const bathrooms = sanitizeNumber(filters?.bathrooms);
  const lotSizeMin = sanitizeNumber(filters?.lotSizeMin);
  const lotSizeMax = sanitizeNumber(filters?.lotSizeMax);

  const priceMinCondition = priceMin !== undefined ? gte(properties.priceUsd, priceMin) : undefined;
  const priceMaxCondition = priceMax !== undefined ? lte(properties.priceUsd, priceMax) : undefined;
  const bedroomsCondition = bedrooms !== undefined ? gte(properties.bedrooms, bedrooms) : undefined;
  const bathroomsCondition =
    bathrooms !== undefined ? gte(properties.bathrooms, bathrooms) : undefined;
  const lotSizeMinCondition =
    lotSizeMin !== undefined ? gte(properties.lotSizeM2, lotSizeMin) : undefined;
  const lotSizeMaxCondition =
    lotSizeMax !== undefined ? lte(properties.lotSizeM2, lotSizeMax) : undefined;

  // Area / sub-location conditions
  const areaCondition = filters?.areaSlug ? eq(properties.areaSlug, filters.areaSlug) : undefined;
  const subLocationCondition = filters?.subLocation
    ? eq(properties.subLocation, filters.subLocation)
    : undefined;

  // Lifestyle tags — OR filter using PostgreSQL && (overlap) operator
  const MAX_TAGS = 20;
  const sanitizedTags = filters?.tags
    ?.filter((t): t is string => typeof t === "string")
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, MAX_TAGS);
  const tagsCondition = sanitizedTags?.length
    ? sql`${properties.lifestyleTags} && ARRAY[${sql.join(sanitizedTags, sql`, `)}]::text[]`
    : undefined;

  // Keyword search — match against title/description fields (mirrors search-actions)
  let searchCondition: SQL | undefined = undefined;
  if (filters?.q && filters.q.trim().length > 0) {
    const queryTerm = filters.q.trim();
    const SYNONYM_GROUPS = [
      {
        keywords: /r[ií]o|river|quebrada|creek|stream/i,
        synonyms: ["rio", "río", "river", "quebrada", "creek", "stream"],
      },
      {
        keywords: /waterfall|cascada|catarata/i,
        synonyms: ["waterfall", "waterfalls", "cascada", "cascadas", "catarata", "cataratas"],
      },
      {
        keywords: /view|vista|panorama|mirador|paisaje/i,
        synonyms: [
          "view",
          "views",
          "vista",
          "vistas",
          "panorama",
          "panorámica",
          "panoramica",
          "mirador",
          "paisaje",
        ],
      },
      {
        keywords: /beach|playa|ocean|sea|mar|oc[eé]ano/i,
        synonyms: ["beach", "playa", "ocean", "sea", "mar", "océano", "oceano", "costa"],
      },
    ];

    const QUERY_STOP_WORDS = new Set([
      "con",
      "de",
      "in",
      "with",
      "and",
      "a",
      "en",
      "la",
      "el",
      "un",
      "una",
      "for",
      "para",
      "los",
      "las",
      "del",
      "y",
      "o",
      "or",
      "to",
      "at",
      "by",
      "of",
    ]);

    const tokens = queryTerm
      .split(/[\s,.\-/?!|;:]+/)
      .map((t) => t.toLowerCase())
      .filter((t) => t.length > 0 && !QUERY_STOP_WORDS.has(t));

    if (tokens.length > 0) {
      const tokenConditions = tokens.map((token) => {
        const matchedGroup = SYNONYM_GROUPS.find((group) => group.keywords.test(token));
        if (matchedGroup) {
          const escapedSynonyms = matchedGroup.synonyms.map(escapeRegex);
          const pattern = `\\y(${escapedSynonyms.join("|")})\\y`;
          return or(
            sql`${properties.titleEn} ~* ${pattern}`,
            sql`${properties.titleEs} ~* ${pattern}`,
            sql`${properties.descriptionEn} ~* ${pattern}`,
            sql`${properties.descriptionEs} ~* ${pattern}`,
          );
        } else {
          const escapedToken = escapeRegex(token);
          const pattern = `\\y(${escapedToken})\\y`;
          return or(
            sql`${properties.titleEn} ~* ${pattern}`,
            sql`${properties.titleEs} ~* ${pattern}`,
            sql`${properties.descriptionEn} ~* ${pattern}`,
            sql`${properties.descriptionEs} ~* ${pattern}`,
          );
        }
      });
      searchCondition = and(...tokenConditions);
    }
  }

  // Bounds conditions using simple lat/lng range comparisons
  const boundsCondition =
    safeBounds != null
      ? and(
          gte(properties.latitude, safeBounds.south),
          lte(properties.latitude, safeBounds.north),
          gte(properties.longitude, safeBounds.west),
          lte(properties.longitude, safeBounds.east),
        )
      : undefined;

  // Compose all conditions — every set dimension applies
  const conditions = and(
    baseConditions,
    typeCondition,
    listingTypeCondition,
    priceMinCondition,
    priceMaxCondition,
    bedroomsCondition,
    bathroomsCondition,
    lotSizeMinCondition,
    lotSizeMaxCondition,
    areaCondition,
    subLocationCondition,
    tagsCondition,
    searchCondition,
    boundsCondition,
  );

  const rows = await db
    .select({
      id: properties.id,
      slug: properties.slug,
      titleEn: properties.titleEn,
      titleEs: properties.titleEs,
      priceUsd: properties.priceUsd,
      bedrooms: properties.bedrooms,
      bathrooms: properties.bathrooms,
      lotSizeM2: properties.lotSizeM2,
      constructionM2: properties.constructionM2,
      zmtStatus: properties.zmtStatus,
      propertyType: properties.propertyType,
      listingType: properties.listingType,
      currency: properties.currency,
      apiRaw: properties.apiRaw,
      images: properties.images,
      latitude: properties.latitude,
      longitude: properties.longitude,
    })
    .from(properties)
    .where(conditions)
    .limit(500);

  // Type-cast: latitude/longitude are guaranteed non-null by the WHERE clause
  return rows.map((row) => ({
    ...row,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    images: normalizePropertyImages(row.images, row.titleEn),
  }));
}
