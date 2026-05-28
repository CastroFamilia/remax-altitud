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
import { and, eq, gte, lte, isNotNull, desc, asc, sql, or, ilike, inArray } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { SearchFilters, SearchResult, PropertySearchItem, FilterFacets } from "@/types/search";
import { mapPropertyRowToSearchItem } from "@/lib/db/queries/properties";

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
  casa: ["Casa", "House", "Residential"],
  house: ["Casa", "House", "Residential"],
  home: ["Casa", "House", "Residential"],
  apartamento: ["Apartamento", "Apartment", "Condominium", "Condo"],
  apartment: ["Apartamento", "Apartment", "Condominium", "Condo"],
  condo: ["Apartamento", "Apartment", "Condominium", "Condo"],
  condominio: ["Apartamento", "Apartment", "Condominium", "Condo"],
  lote: ["Lote", "Lot", "Land"],
  lot: ["Lote", "Lot", "Land"],
  terreno: ["Terreno", "Terrenos", "Land", "Lot"],
  land: ["Terreno", "Terrenos", "Land", "Lot"],
  comercial: ["Comercial", "Commercial", "Business"],
  commercial: ["Comercial", "Commercial", "Business"],
  finca: ["Finca", "Farm", "Ranch"],
  farm: ["Finca", "Farm", "Ranch"],
  ranch: ["Finca", "Farm", "Ranch"],
};

const DB_TYPE_TO_SPANISH: Record<string, string> = {
  House: "Casa",
  Residential: "Casa",
  Apartment: "Apartamento",
  Condominium: "Apartamento",
  Condo: "Apartamento",
  Lot: "Lote",
  Land: "Terreno",
  Commercial: "Comercial",
  Farm: "Finca",
  Ranch: "Finca",
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
 * searchProperties — Server Action for filter queries.
 *
 * Executes a filtered property search against PostgreSQL using Drizzle ORM.
 * Always filters isVisible=true. Supports type, price, bedrooms, bathrooms,
 * lot size, area, and sort. Returns properties and facet counts.
 *
 * AC: #1, #2, #6, #9, #10
 */
export async function searchProperties(filters: SearchFilters, page = 1): Promise<SearchResult> {
  // Sanitize page parameter — clamp to >= 1
  const safePage = Math.max(1, Math.floor(sanitizeNumber(page) ?? 1));

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

  // Build keyword search conditions with river synonym expansion
  let searchCondition: SQL | undefined = undefined;
  if (filters.q && filters.q.trim().length > 0) {
    const queryTerm = filters.q.trim();
    const isRiverQuery = /r[ií]o|river|quebrada/i.test(queryTerm);
    if (isRiverQuery) {
      const riverSynonyms = ["rio", "río", "river", "quebrada"];
      const synonymConditions = riverSynonyms.flatMap((term) => {
        const matchPattern = `%${term}%`;
        return [
          ilike(properties.titleEn, matchPattern),
          ilike(properties.titleEs, matchPattern),
          ilike(properties.descriptionEn, matchPattern),
          ilike(properties.descriptionEs, matchPattern),
        ];
      });
      searchCondition = or(...synonymConditions);
    } else {
      const matchPattern = `%${queryTerm}%`;
      searchCondition = or(
        ilike(properties.titleEn, matchPattern),
        ilike(properties.titleEs, matchPattern),
        ilike(properties.descriptionEn, matchPattern),
        ilike(properties.descriptionEs, matchPattern),
      );
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
    priceMin: safePriceMin !== undefined ? gte(properties.priceUsd, safePriceMin) : undefined,
    priceMax: safePriceMax !== undefined ? lte(properties.priceUsd, safePriceMax) : undefined,
    bedrooms: bedrooms !== undefined ? gte(properties.bedrooms, bedrooms) : undefined,
    bathrooms: bathrooms !== undefined ? gte(properties.bathrooms, bathrooms) : undefined,
    lotSizeMin: safeLotMin !== undefined ? gte(properties.lotSizeM2, safeLotMin) : undefined,
    lotSizeMax: safeLotMax !== undefined ? lte(properties.lotSizeM2, safeLotMax) : undefined,
    areaSlug: filters.areaSlug ? eq(properties.areaSlug, filters.areaSlug) : undefined,
    // Story 3.4: lifestyle tag OR filter using PostgreSQL && (overlap) operator on GIN-indexed array
    // The && operator returns rows where lifestyleTags and the filter array share at least one element
    tags: sanitizedTags?.length
      ? sql`${properties.lifestyleTags} && ARRAY[${sql.join(sanitizedTags, sql`, `)}]::text[]`
      : undefined,
    q: searchCondition,
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
      status: properties.status,
      areaSlug: properties.areaSlug,
      images: properties.images,
      latitude: properties.latitude,
      longitude: properties.longitude,
    })
    .from(properties)
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
    .where(facetWhere("type"))
    .groupBy(properties.propertyType);

  // byBedrooms: apply every filter except `bedrooms`
  const byBedroomsRows = await db
    .select({
      value: properties.bedrooms,
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(properties)
    .where(and(facetWhere("bedrooms"), isNotNull(properties.bedrooms)))
    .groupBy(properties.bedrooms);

  // byBathrooms: apply every filter except `bathrooms`
  const byBathroomsRows = await db
    .select({
      value: properties.bathrooms,
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(properties)
    .where(and(facetWhere("bathrooms"), isNotNull(properties.bathrooms)))
    .groupBy(properties.bathrooms);

  // Total count — separate aggregation so `total` reflects the true result
  // count (not just the page slice). Pagination is Story 3.5.
  const totalRows = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(properties)
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
  };

  return {
    properties: propertyItems,
    total,
    facets,
  };
}

/**
 * getAvailableAreas — fetch distinct area slugs from visible properties.
 *
 * MVP: flat list of area slugs (full hierarchy deferred to Epic 6 / Story 6.1).
 * AC #7
 */
export async function getAvailableAreas(): Promise<{ slug: string; label: string }[]> {
  const rows = await db
    .select({ areaSlug: properties.areaSlug })
    .from(properties)
    .where(and(eq(properties.isVisible, true), isNotNull(properties.areaSlug)))
    .groupBy(properties.areaSlug);

  return rows
    .filter((r): r is { areaSlug: string } => r.areaSlug !== null && r.areaSlug !== "")
    .map((r) => ({
      slug: r.areaSlug,
      label: formatAreaLabel(r.areaSlug),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
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
