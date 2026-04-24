import { customType } from "drizzle-orm/pg-core";

export type GeoPoint = { lng: number; lat: number };

/**
 * EWKT-based PostGIS `geography(Point, 4326)` column.
 *
 * Writes emit `SRID=4326;POINT(lng lat)` — PostGIS parses this directly on
 * INSERT/UPDATE. Reads return the raw EWKB hex from postgres-js. Callers that
 * need `{ lng, lat }` back MUST project via `ST_X(geo::geometry)` /
 * `ST_Y(geo::geometry)` in their SELECT — do NOT try to parse EWKB in JS.
 */
export const geographyPoint = customType<{
  data: GeoPoint;
  driverData: string;
}>({
  dataType() {
    return "geography(Point, 4326)";
  },
  toDriver(value: GeoPoint): string {
    return `SRID=4326;POINT(${value.lng} ${value.lat})`;
  },
});
