import "server-only";
import { and, asc, desc, eq, not } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { areas } from "@/lib/db/schema/areas";
import { properties } from "@/lib/db/schema/properties";
import { propertySearchColumns, mapPropertyRowToSearchItem } from "./properties";
import type { PropertySearchItem } from "@/types/search";

/**
 * Fetches all areas ordered by sortOrder ascending.
 * Used by the area index page (AC #7) and generateStaticParams.
 */
export async function getAllAreas() {
  return db.select().from(areas).orderBy(asc(areas.sortOrder));
}

/**
 * Fetches a single area by its URL slug.
 * Returns null if not found.
 * Used by the area guide page (AC #1).
 */
export async function getAreaBySlug(slug: string) {
  const rows = await db.select().from(areas).where(eq(areas.slug, slug)).limit(1);
  return rows[0] ?? null;
}

/**
 * Fetches all area slugs for SSG build-time generation.
 * Used by generateStaticParams (AC #8).
 */
export async function getAllAreaSlugs(): Promise<string[]> {
  const rows = await db.select({ slug: areas.slug }).from(areas);
  return rows.map((r) => r.slug);
}

/**
 * Fetches visible properties filtered by area slug.
 * Returns PropertySearchItem[] compatible with PropertyCard.
 * Used by the Properties tab on area guide pages (AC #4).
 */
export async function getPropertiesByAreaSlug(areaSlug: string): Promise<PropertySearchItem[]> {
  const rows = await db
    .select(propertySearchColumns)
    .from(properties)
    .where(and(eq(properties.areaSlug, areaSlug), eq(properties.isVisible, true)))
    .orderBy(desc(properties.syncedAt));
  return rows.map(mapPropertyRowToSearchItem);
}

/**
 * Fetches areas in the same region, excluding the current area.
 * Used by the SimilarAreasSlider component (AC #3).
 * Ordered by sortOrder ascending.
 */
export async function getSimilarAreas(region: string, excludeSlug: string) {
  return db
    .select()
    .from(areas)
    .where(and(eq(areas.region, region), not(eq(areas.slug, excludeSlug))))
    .orderBy(asc(areas.sortOrder));
}
