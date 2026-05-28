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
    if (!value) return null as any;
    return `SRID=4326;POINT(${value.lng} ${value.lat})`;
  },
});

export type GeoPolygon = [number, number][];

export const geographyPolygon = customType<{
  data: GeoPolygon;
  driverData: string;
}>({
  dataType() {
    return "geography(Polygon, 4326)";
  },
  toDriver(value: GeoPolygon): string {
    if (!value) return null as any;
    if (value.length < 3) {
      throw new Error("Polygon must have at least 3 points");
    }
    // Ensure the polygon ring is closed (first and last coordinate MUST be identical)
    const coords = [...value];
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coords.push(first);
    }
    const ringStr = coords.map(([lng, lat]) => `${lng} ${lat}`).join(", ");
    return `SRID=4326;POLYGON((${ringStr}))`;
  },
});

