"use server";

/**
 * Story 3.2: Server Action — getPropertiesForMap
 *
 * Fetches visible properties with valid coordinates for the map.
 * Optionally filters by bounding box using PostGIS ST_MakeEnvelope.
 * Returns a max of 500 properties (spatial index idx_properties_geo is on geo column).
 *
 * @see _bmad-output/implementation-artifacts/3-2-interactive-map-with-property-pins.md Task 8
 */

import { and, isNotNull, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { properties } from "@/lib/db/schema";

export type MapProperty = {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  priceUsd: number;
  bedrooms: number | null;
  bathrooms: number | null;
  lotSizeM2: number | null;
  zmtStatus: string;
  images: { url: string; alt?: string }[];
  latitude: number;
  longitude: number;
};

export async function getPropertiesForMap(bounds?: {
  north: number;
  south: number;
  east: number;
  west: number;
}): Promise<MapProperty[]> {
  const baseConditions = and(
    eq(properties.isVisible, true),
    isNotNull(properties.latitude),
    isNotNull(properties.longitude),
  );

  const conditions =
    bounds != null
      ? and(
          baseConditions,
          sql`${properties.geo} && ST_MakeEnvelope(${bounds.west}, ${bounds.south}, ${bounds.east}, ${bounds.north}, 4326)::geography`,
        )
      : baseConditions;

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
      zmtStatus: properties.zmtStatus,
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
    images: (row.images as { url: string; alt?: string }[]) ?? [],
  }));
}
