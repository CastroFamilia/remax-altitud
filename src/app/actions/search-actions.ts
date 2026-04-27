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
import { and, eq, gte, lte, isNotNull, desc, asc, sql } from "drizzle-orm";
import type { SearchFilters, SearchResult, PropertySearchItem, FilterFacets } from "@/types/search";

/**
 * Sanitize a numeric value — returns undefined if the value is not a finite
 * number, paralleling the sanitizeBounds pattern in map-actions.ts (Story 3.2).
 */
function sanitizeNumber(value: number | undefined): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Number.isFinite(value)) return undefined;
  return value;
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
export async function searchProperties(filters: SearchFilters): Promise<SearchResult> {
  // Sanitize all numeric inputs (guard against NaN, Infinity — ADR-5 compliance)
  const priceMin = sanitizeNumber(filters.priceMin);
  const priceMax = sanitizeNumber(filters.priceMax);
  const bedrooms = sanitizeNumber(filters.bedrooms);
  const bathrooms = sanitizeNumber(filters.bathrooms);
  const lotSizeMin = sanitizeNumber(filters.lotSizeMin);
  const lotSizeMax = sanitizeNumber(filters.lotSizeMax);

  // Build WHERE conditions — always include isVisible=true
  const conditions = [eq(properties.isVisible, true)];

  if (filters.type) {
    conditions.push(eq(properties.propertyType, filters.type));
  }
  if (priceMin !== undefined) {
    conditions.push(gte(properties.priceUsd, priceMin));
  }
  if (priceMax !== undefined) {
    conditions.push(lte(properties.priceUsd, priceMax));
  }
  if (bedrooms !== undefined) {
    conditions.push(gte(properties.bedrooms, bedrooms));
  }
  if (bathrooms !== undefined) {
    conditions.push(gte(properties.bathrooms, bathrooms));
  }
  if (lotSizeMin !== undefined) {
    conditions.push(gte(properties.lotSizeM2, lotSizeMin));
  }
  if (lotSizeMax !== undefined) {
    conditions.push(lte(properties.lotSizeM2, lotSizeMax));
  }
  if (filters.areaSlug) {
    conditions.push(eq(properties.areaSlug, filters.areaSlug));
  }

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

  // Main properties query — limit 50, offset 0 for MVP (pagination: Story 3.5)
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
      areaSlug: properties.areaSlug,
      images: properties.images,
      latitude: properties.latitude,
      longitude: properties.longitude,
    })
    .from(properties)
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(50)
    .offset(0);

  const propertyItems: PropertySearchItem[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    titleEn: row.titleEn,
    titleEs: row.titleEs,
    priceUsd: row.priceUsd,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    lotSizeM2: row.lotSizeM2,
    constructionM2: row.constructionM2,
    zmtStatus: row.zmtStatus,
    propertyType: row.propertyType,
    areaSlug: row.areaSlug,
    images: (row.images as { url: string; alt?: string }[]) ?? [],
    latitude: row.latitude,
    longitude: row.longitude,
  }));

  // Facets queries — aggregation for filter count display ("Casa (12)") — AC #6
  // byType: count per property type (for all visible, unfiltered by type)
  const byTypeRows = await db
    .select({
      value: properties.propertyType,
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(properties)
    .where(eq(properties.isVisible, true))
    .groupBy(properties.propertyType);

  // byBedrooms: count per bedroom value
  const byBedroomsRows = await db
    .select({
      value: properties.bedrooms,
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(properties)
    .where(and(eq(properties.isVisible, true), isNotNull(properties.bedrooms)))
    .groupBy(properties.bedrooms);

  // byBathrooms: count per bathroom value
  const byBathroomsRows = await db
    .select({
      value: properties.bathrooms,
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(properties)
    .where(and(eq(properties.isVisible, true), isNotNull(properties.bathrooms)))
    .groupBy(properties.bathrooms);

  const facets: FilterFacets = {
    byType: byTypeRows
      .filter((r) => r.value !== null)
      .map((r) => ({ value: r.value as string, count: r.count })),
    byBedrooms: byBedroomsRows
      .filter((r) => r.value !== null)
      .map((r) => ({ value: r.value as number, count: r.count })),
    byBathrooms: byBathroomsRows
      .filter((r) => r.value !== null)
      .map((r) => ({ value: r.value as number, count: r.count })),
  };

  return {
    properties: propertyItems,
    total: propertyItems.length,
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
