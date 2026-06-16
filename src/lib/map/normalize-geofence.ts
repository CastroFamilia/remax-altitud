/**
 * Normalizes geo-fence coordinate data from the database.
 *
 * The admin form saves geoFenceCoords as a GeoJSON-like object:
 *   { type: "Polygon", coordinates: [[[lng, lat], ...]] }
 *
 * But consumer components (static map builder, community cards) expect a
 * flat coordinate ring:
 *   [[lng, lat], [lng, lat], ...]
 *
 * This utility handles both shapes so every consumer gets a consistent format.
 */

/**
 * Accepts the raw `geoFenceCoords` value from the database (could be either
 * a flat coordinate array or a GeoJSON-like Polygon object) and returns a
 * normalised flat coordinate ring, or null when no valid data is present.
 */
export function normalizeGeoFenceCoords(raw: unknown): [number, number][] | null {
  if (raw == null) return null;

  // Already a flat coordinate array: [[lng, lat], ...]
  if (Array.isArray(raw)) {
    if (raw.length === 0) return null;
    // Quick sanity check: first element should be a [number, number] pair
    if (Array.isArray(raw[0]) && typeof raw[0][0] === "number") {
      return raw as [number, number][];
    }
    return null;
  }

  // GeoJSON-like object: { type: "Polygon", coordinates: [[[lng, lat], ...]] }
  if (typeof raw === "object") {
    const obj = raw as { type?: string; coordinates?: unknown[][] };
    if (obj.coordinates && Array.isArray(obj.coordinates)) {
      const ring = obj.coordinates[0];
      if (Array.isArray(ring) && ring.length > 0) {
        return ring as [number, number][];
      }
    }
  }

  return null;
}
