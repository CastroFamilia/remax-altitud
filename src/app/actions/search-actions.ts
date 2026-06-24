"use server";

/**
 * Story 3.3: Search Filters & URL State
 * Server Actions: searchProperties, getAvailableAreas
 *
 * Architecture mandate (ADR-5): Server Actions over REST API for Search.
 * This module provides Drizzle-powered search with PostGIS-compatible queries.
 *
 * Note: map-actions.ts (Story 3.2) is FROZEN — do NOT import or modify it here.
 */

import { db } from "@/lib/db/client";
import { properties } from "@/lib/db/schema/properties";
import { communities } from "@/lib/db/schema/communities";
import { areas } from "@/lib/db/schema/areas";
import { and, eq, ilike, gte, lte, isNotNull, desc, asc, sql, or, inArray } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { SearchFilters, SearchResult, PropertySearchItem, FilterFacets } from "@/types/search";
import { mapPropertyRowToSearchItem, propertySearchColumns } from "@/lib/db/queries/properties";
import { trackSearchInBackground } from "@/lib/services/tracking";
import { getDistrictLabel } from "@/lib/locations";

export type RawBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

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

  // Reject inverted / degenerate envelopes — these cause ST_MakeEnvelope to
  // either return empty results or throw, depending on PostGIS version.
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

/**
 * Sanitize a numeric value — returns undefined if the value is not a finite,
 * non-negative number, paralleling the sanitizeBounds pattern in map-actions.ts
 * (Story 3.2). Negative values are rejected because all numeric filter
 * dimensions (price, bedrooms, bathrooms, lot size) must be ≥ 0.
 */
function sanitizeNumber(value: number | undefined): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Number.isFinite(value)) return undefined;
  if (value < 0) return undefined;
  return value;
}

const TYPE_EQUIVALENTS: Record<string, string[]> = {
  casa: ["Casa", "House", "Residential", "House/Villa"],
  house: ["Casa", "House", "Residential", "House/Villa"],
  home: ["Casa", "House", "Residential", "House/Villa"],
  apartamento: ["Apartamento", "Apartment", "Condominium", "Condo"],
  apartment: ["Apartamento", "Apartment", "Condominium", "Condo"],
  condo: ["Apartamento", "Apartment", "Condominium", "Condo"],
  condominio: ["Apartamento", "Apartment", "Condominium", "Condo"],
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
  land: [
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
  ranch: [
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

const DB_TYPE_TO_SPANISH: Record<string, string> = {
  // English → Spanish
  House: "Casa",
  "House/Villa": "Casa",
  Residential: "Casa",
  Apartment: "Apartamento",
  Condominium: "Apartamento",
  Condo: "Apartamento",
  Lot: "Lote",
  "Lot/Land": "Lote",
  Land: "Lote",
  Commercial: "Comercial",
  Business: "Comercial",
  Farm: "Finca",
  Ranch: "Finca",
  "Rural area": "Finca",
  // Spanish → Spanish (API sometimes sends Spanish values in PropertyTypeName_en)
  Casa: "Casa",
  Apartamento: "Apartamento",
  Lote: "Lote",
  Terreno: "Lote",
  Terrenos: "Lote",
  Comercial: "Comercial",
  Finca: "Finca",
};

function getPropertyTypeEquivalents(type: string): string[] {
  const normalized = type.toLowerCase().trim();
  const equivalents = TYPE_EQUIVALENTS[normalized];
  if (equivalents) {
    return equivalents;
  }
  const capitalized = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  return [type, normalized, capitalized];
}

/**
 * Escapes special regex characters in a query token to prevent regex injection.
 */
function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * searchProperties — Server Action for filter queries.
 *
 * Executes a filtered property search against PostgreSQL using Drizzle ORM.
 * Always filters isVisible=true. Supports type, price, bedrooms, bathrooms,
 * lot size, area, and sort. Returns properties and facet counts.
 *
 * AC: #1, #2, #6, #9, #10
 */
export async function searchProperties(
  filters: SearchFilters,
  page = 1,
  bounds?: RawBounds,
): Promise<SearchResult> {
  try {
    // Sanitize page parameter — clamp to >= 1
    const safePage = Math.max(1, Math.floor(sanitizeNumber(page) ?? 1));

    // If bounds are provided, filter properties inside the bounds
    const safeBounds = bounds != null ? sanitizeBounds(bounds) : null;

    // Sanitize all numeric inputs (guard against NaN, Infinity — ADR-5 compliance)
    const priceMin = sanitizeNumber(filters.priceMin);
    const priceMax = sanitizeNumber(filters.priceMax);
    const bedrooms = sanitizeNumber(filters.bedrooms);
    const bathrooms = sanitizeNumber(filters.bathrooms);
    const lotSizeMin = sanitizeNumber(filters.lotSizeMin);
    const lotSizeMax = sanitizeNumber(filters.lotSizeMax);

    // Story 3.4: sanitize lifestyle tag array — server actions are publicly
    // callable, so reject non-string entries, trim whitespace, drop empties,
    // and cap the array length to bound the SQL parameter size. The hard cap
    // is set well above the 5 known tags to allow future expansion without
    // becoming a DoS surface.
    const MAX_TAGS = 20;
    const sanitizedTags = filters.tags
      ?.filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .slice(0, MAX_TAGS);

    // Normalise inverted ranges defensively — an inverted range can only return
    // zero rows, which surfaces as a confusing empty state. Swap silently rather
    // than fail closed.
    const safePriceMin =
      priceMin !== undefined && priceMax !== undefined && priceMin > priceMax ? priceMax : priceMin;
    const safePriceMax =
      priceMin !== undefined && priceMax !== undefined && priceMin > priceMax ? priceMin : priceMax;
    const safeLotMin =
      lotSizeMin !== undefined && lotSizeMax !== undefined && lotSizeMin > lotSizeMax
        ? lotSizeMax
        : lotSizeMin;
    const safeLotMax =
      lotSizeMin !== undefined && lotSizeMax !== undefined && lotSizeMin > lotSizeMax
        ? lotSizeMin
        : lotSizeMax;

    // Resolve area slugs for region filter
    let matchingAreaSlugs: string[] = [];
    if (filters.region) {
      const areaRows = await db
        .select({ slug: areas.slug })
        .from(areas)
        .where(ilike(areas.region, filters.region));
      matchingAreaSlugs = areaRows.map((r) => r.slug).filter((s): s is string => s !== null);
    }

    // Build keyword search conditions with feature synonym expansion
    let searchCondition: SQL | undefined = undefined;
    if (filters.q && filters.q.trim().length > 0) {
      const queryTerm = filters.q.trim();

      // Define synonym expansion groups
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
        "al",
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
        "near",
        "cerca",
        "the",
        // Transaction intent words — these indicate buy/sell/rent intent and
        // should never be used as keyword search terms against property content.
        // The client-side parser strips them, but this is defense-in-depth.
        "sell",
        "sale",
        "buy",
        "purchase",
        "buying",
        "selling",
        "comprar",
        "vender",
        "venta",
        "compra",
        "rent",
        "renting",
        "lease",
        "leasing",
        "alquilar",
        "arrendar",
        "arriendo",
      ]);

      // Split by whitespace and punctuation, map to lowercase and filter out stop words
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
              sql`${communities.name} ~* ${pattern}`,
              sql`REPLACE(${properties.subLocation}, '-', ' ') ~* ${pattern}`,
              sql`REPLACE(${properties.areaSlug}, '-', ' ') ~* ${pattern}`,
            );
          } else {
            const escapedToken = escapeRegex(token);
            const pattern = `\\y(${escapedToken})\\y`;
            return or(
              sql`${properties.titleEn} ~* ${pattern}`,
              sql`${properties.titleEs} ~* ${pattern}`,
              sql`${properties.descriptionEn} ~* ${pattern}`,
              sql`${properties.descriptionEs} ~* ${pattern}`,
              sql`${communities.name} ~* ${pattern}`,
              sql`REPLACE(${properties.subLocation}, '-', ' ') ~* ${pattern}`,
              sql`REPLACE(${properties.areaSlug}, '-', ' ') ~* ${pattern}`,
            );
          }
        });
        searchCondition = and(...tokenConditions);
      }
    }

    // Build a per-dimension condition map so we can compose facet WHERE clauses
    // that exclude the dimension being faceted. Each entry is the SQL filter
    // that would be applied if that dimension is set.
    const dimConditions: Record<string, SQL | undefined> = {
      visible: eq(properties.isVisible, true),
      type: filters.type
        ? inArray(properties.propertyType, getPropertyTypeEquivalents(filters.type))
        : undefined,
      listingType: filters.listingType
        ? eq(properties.listingType, filters.listingType)
        : undefined,
      priceMin: safePriceMin !== undefined ? gte(properties.priceUsd, safePriceMin) : undefined,
      priceMax: safePriceMax !== undefined ? lte(properties.priceUsd, safePriceMax) : undefined,
      bedrooms: bedrooms !== undefined ? gte(properties.bedrooms, bedrooms) : undefined,
      bathrooms: bathrooms !== undefined ? gte(properties.bathrooms, bathrooms) : undefined,
      lotSizeMin: safeLotMin !== undefined ? gte(properties.lotSizeM2, safeLotMin) : undefined,
      lotSizeMax: safeLotMax !== undefined ? lte(properties.lotSizeM2, safeLotMax) : undefined,
      areaSlug: filters.areaSlug ? eq(properties.areaSlug, filters.areaSlug) : undefined,
      subLocation: filters.subLocation
        ? eq(properties.subLocation, filters.subLocation)
        : undefined,
      // Story 3.4: lifestyle tag OR filter using PostgreSQL && (overlap) operator on GIN-indexed array
      // The && operator returns rows where lifestyleTags and the filter array share at least one element
      tags: sanitizedTags?.length
        ? sql`${properties.lifestyleTags} && ARRAY[${sql.join(sanitizedTags, sql`, `)}]::text[]`
        : undefined,
      q: searchCondition,
      region: filters.region
        ? matchingAreaSlugs.length > 0
          ? inArray(properties.areaSlug, matchingAreaSlugs)
          : eq(properties.id, "00000000-0000-0000-0000-000000000000") // No results if region has no areas
        : undefined,
      bounds:
        safeBounds != null
          ? and(
              gte(properties.latitude, safeBounds.south),
              lte(properties.latitude, safeBounds.north),
              gte(properties.longitude, safeBounds.west),
              lte(properties.longitude, safeBounds.east),
            )
          : undefined,
    };

    // Compose conditions for the main query — every set dimension applies.
    const conditions = Object.values(dimConditions).filter(
      (c): c is NonNullable<typeof c> => c !== undefined,
    );

    // Determine sort order
    let orderByClause;
    if (filters.sort === "price_asc") {
      orderByClause = asc(properties.priceUsd);
    } else if (filters.sort === "price_desc") {
      orderByClause = desc(properties.priceUsd);
    } else {
      // Default: newest first
      orderByClause = desc(properties.createdAt);
    }

    const whereClause = and(...conditions);

    // Main properties query — limit 20 per page with offset for pagination (Story 3.5)
    const rows = await db
      .select(propertySearchColumns)
      .from(properties)
      .leftJoin(communities, eq(properties.communityId, communities.id))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(20)
      .offset((safePage - 1) * 20);

    const propertyItems: PropertySearchItem[] = rows.map((row) => mapPropertyRowToSearchItem(row));

    // Facets queries — aggregation for filter count display ("Casa (12)") — AC #6
    // Each facet dimension is computed with all OTHER dimensions applied so that
    // the counts reflect what the user would see if they switched that
    // dimension's value (spec: "current filter set excluding the dimension being
    // faceted").
    function facetWhere(excludeKey: string) {
      const subset = Object.entries(dimConditions)
        .filter(([k, v]) => k !== excludeKey && v !== undefined)
        .map(([, v]) => v as NonNullable<typeof v>);
      return and(...subset);
    }

    // byType: apply every filter except `type` so user can see counts of other
    // types matching the rest of their criteria.
    const byTypeRows = await db
      .select({
        value: properties.propertyType,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(properties)
      .leftJoin(communities, eq(properties.communityId, communities.id))
      .where(facetWhere("type"))
      .groupBy(properties.propertyType);

    // byBedrooms: apply every filter except `bedrooms`
    const byBedroomsRows = await db
      .select({
        value: properties.bedrooms,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(properties)
      .leftJoin(communities, eq(properties.communityId, communities.id))
      .where(and(facetWhere("bedrooms"), isNotNull(properties.bedrooms)))
      .groupBy(properties.bedrooms);

    // byBathrooms: apply every filter except `bathrooms`
    const byBathroomsRows = await db
      .select({
        value: properties.bathrooms,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(properties)
      .leftJoin(communities, eq(properties.communityId, communities.id))
      .where(and(facetWhere("bathrooms"), isNotNull(properties.bathrooms)))
      .groupBy(properties.bathrooms);

    // byListingType: apply every filter except `listingType`
    const byListingTypeRows = await db
      .select({
        value: properties.listingType,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(properties)
      .leftJoin(communities, eq(properties.communityId, communities.id))
      .where(and(facetWhere("listingType"), isNotNull(properties.listingType)))
      .groupBy(properties.listingType);

    // Total count — separate aggregation so `total` reflects the true result
    // count (not just the page slice). Pagination is Story 3.5.
    const totalRows = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(properties)
      .leftJoin(communities, eq(properties.communityId, communities.id))
      .where(whereClause);
    const total = totalRows[0]?.count ?? propertyItems.length;

    const spanishTypeCounts: Record<string, number> = {};
    for (const row of byTypeRows) {
      if (row.value === null) continue;
      const spanishType = DB_TYPE_TO_SPANISH[row.value] || row.value;
      spanishTypeCounts[spanishType] = (spanishTypeCounts[spanishType] || 0) + row.count;
    }
    const byTypeFacets = Object.entries(spanishTypeCounts).map(([value, count]) => ({
      value,
      count,
    }));

    const facets: FilterFacets = {
      byType: byTypeFacets,
      byBedrooms: byBedroomsRows
        .filter((r) => r.value !== null)
        .map((r) => ({ value: r.value as number, count: r.count })),
      byBathrooms: byBathroomsRows
        .filter((r) => r.value !== null)
        .map((r) => ({ value: r.value as number, count: r.count })),
      byListingType: byListingTypeRows
        .filter((r) => r.value !== null)
        .map((r) => ({ value: r.value as string, count: r.count })),
    };

    // Trigger tracking asynchronously in the background (fire and forget)
    const searchMode = filters.q ? "smart" : "traditional";
    trackSearchInBackground({
      rawQuery: filters.q,
      parsedFilters: filters,
      searchMode,
      resultsCount: total,
    });

    return {
      properties: propertyItems,
      total,
      facets,
    };
  } catch (error) {
    console.error("Database query failed in searchProperties:", error);
    return {
      properties: [],
      total: 0,
      facets: {
        byType: [],
        byBedrooms: [],
        byBathrooms: [],
        byListingType: [],
      },
    };
  }
}

/**
 * getAvailableAreas — fetch distinct area slugs and sub-locations from visible properties.
 *
 * Returns a hierarchical list: main areas first, then sub-locations with their
 * parent area slug. This powers grouped area selectors (optgroup dropdowns).
 * AC #7
 */
export async function getAvailableAreas(): Promise<
  { slug: string; label: string; parentSlug?: string; isSubLocation?: boolean }[]
> {
  try {
    // Get distinct main area slugs
    const areaRows = await db
      .select({ areaSlug: properties.areaSlug })
      .from(properties)
      .where(and(eq(properties.isVisible, true), isNotNull(properties.areaSlug)))
      .groupBy(properties.areaSlug);

    const mainAreas = areaRows
      .filter((r): r is { areaSlug: string } => r.areaSlug !== null && r.areaSlug !== "")
      .map((r) => ({
        slug: r.areaSlug,
        label: formatAreaLabel(r.areaSlug),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    // Get distinct sub-locations
    const subRows = await db
      .select({
        areaSlug: properties.areaSlug,
        subLocation: properties.subLocation,
      })
      .from(properties)
      .where(and(eq(properties.isVisible, true), isNotNull(properties.subLocation)))
      .groupBy(properties.areaSlug, properties.subLocation);

    const subLocations = subRows
      .filter(
        (r): r is { areaSlug: string; subLocation: string } =>
          r.areaSlug !== null && r.subLocation !== null && r.subLocation !== "",
      )
      .map((r) => ({
        slug: r.subLocation,
        label: formatSubLocationLabel(r.subLocation),
        parentSlug: r.areaSlug,
        isSubLocation: true,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return [...mainAreas, ...subLocations];
  } catch (error) {
    console.error("Database query failed in getAvailableAreas:", error);
    return [];
  }
}

/**
 * Format an area slug into a display label.
 * "perez-zeledon" → "Pérez Zeledón" (using a known mapping + fallback title-case)
 */
function formatAreaLabel(slug: string): string {
  const knownAreas: Record<string, string> = {
    "perez-zeledon": "Pérez Zeledón",
    dominical: "Dominical",
    uvita: "Uvita",
    ojochal: "Ojochal",
    "tinamastes-platanillo": "Tinamastes, Platanillo & Barú",
    quepos: "Quepos",
    "manuel-antonio": "Manuel Antonio",
    jaco: "Jacó",
    tamarindo: "Tamarindo",
    nosara: "Nosara",
    samara: "Sámara",
    "santa-teresa": "Santa Teresa",
    "playa-hermosa": "Playa Hermosa",
    liberia: "Liberia",
    "san-jose": "San José",
    escazu: "Escazú",
    "santa-ana": "Santa Ana",
    heredia: "Heredia",
    alajuela: "Alajuela",
    cartago: "Cartago",
  };

  if (knownAreas[slug]) return knownAreas[slug];

  // Fallback: title-case the slug (replace hyphens with spaces, capitalize words)
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Format a sub-location slug into a display label.
 * Uses the shared locations module as single source of truth.
 */
function formatSubLocationLabel(slug: string): string {
  return getDistrictLabel(slug);
}
