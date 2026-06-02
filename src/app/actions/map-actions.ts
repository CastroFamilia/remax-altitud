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

import { and, isNotNull, eq, gte, lte } from "drizzle-orm";
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

export async function getPropertiesForMap(bounds?: RawBounds): Promise<MapProperty[]> {
  const baseConditions = and(
    eq(properties.isVisible, true),
    isNotNull(properties.latitude),
    isNotNull(properties.longitude),
  );

  const safeBounds = bounds != null ? sanitizeBounds(bounds) : null;

  // Use simple lat/lng range comparisons instead of PostGIS geo operators.
  // The `&&` operator with ST_MakeEnvelope doesn't work correctly on
  // geography(Point, 4326) columns — it requires geometry type.
  const conditions =
    safeBounds != null
      ? and(
          baseConditions,
          gte(properties.latitude, safeBounds.south),
          lte(properties.latitude, safeBounds.north),
          gte(properties.longitude, safeBounds.west),
          lte(properties.longitude, safeBounds.east),
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
