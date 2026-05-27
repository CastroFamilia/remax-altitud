/**
 * Mapbox Static Images API URL Builder — Story 6.3
 *
 * Constructs static map image URLs for community mini-maps and thumbnail maps.
 * Uses the Mapbox Static Images API (server-only, no Mapbox GL JS).
 *
 * IMPORTANT: This module must NEVER import interactive Mapbox GL libraries or any
 * interactive map component. Community pages use static <img> only (AC #4).
 *
 * @see _bmad-output/implementation-artifacts/6-3-community-mini-map-and-geo-fence-display.md
 */
import "server-only";

import { MAPBOX_TOKEN } from "@/lib/map/config";

const MAPBOX_STATIC_BASE =
  "https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MiniMapOptions {
  latitude: number;
  longitude: number;
  geoFenceCoords?: [number, number][] | null; // GeoJSON polygon ring [[lng,lat], ...]
  communityName: string;
  zoom?: number; // default 13
  width?: number; // default 600
  height?: number; // default 400
  retina?: boolean; // default true
}

export interface ThumbnailMapOptions {
  latitude: number;
  longitude: number;
  geoFenceCoords?: [number, number][] | null;
  zoom?: number; // default 11
  width?: number; // default 300
  height?: number; // default 200
  retina?: boolean; // default true
}

// ---------------------------------------------------------------------------
// URL Builders
// ---------------------------------------------------------------------------

/**
 * Builds a Mapbox Static Images API URL for a community mini-map.
 * Includes community pin marker + optional geo-fence polygon overlay.
 */
export function buildCommunityMiniMapUrl(options: MiniMapOptions): string {
  const {
    latitude,
    longitude,
    geoFenceCoords,
    zoom = 13,
    width = 600,
    height = 400,
    retina = true,
  } = options;

  const overlays: string[] = [];

  // Geo-fence polygon path overlay (shaded fill)
  if (geoFenceCoords && geoFenceCoords.length >= 3) {
    const pathOverlay = encodeGeoFencePath(geoFenceCoords);
    overlays.push(pathOverlay);
  }

  // Community center pin marker (gold color #C2A661)
  overlays.push(`pin-l+C2A661(${longitude},${latitude})`);

  const overlayStr = overlays.join(",");
  const retinaStr = retina ? "@2x" : "";

  return `${MAPBOX_STATIC_BASE}/${overlayStr}/${longitude},${latitude},${zoom}/${width}x${height}${retinaStr}?access_token=${MAPBOX_TOKEN}`;
}

/**
 * Builds a smaller Mapbox Static Images API URL for community card thumbnails.
 * Used in area guide pages for community cards (AC #3).
 */
export function buildAreaThumbnailMapUrl(options: ThumbnailMapOptions): string {
  const {
    latitude,
    longitude,
    geoFenceCoords,
    zoom = 11,
    width = 300,
    height = 200,
    retina = true,
  } = options;

  const overlays: string[] = [];

  // Geo-fence polygon path overlay (shaded fill)
  if (geoFenceCoords && geoFenceCoords.length >= 3) {
    const pathOverlay = encodeGeoFencePath(geoFenceCoords);
    overlays.push(pathOverlay);
  }

  // Community center pin marker (gold color #C2A661)
  overlays.push(`pin-l+C2A661(${longitude},${latitude})`);

  const overlayStr = overlays.join(",");
  const retinaStr = retina ? "@2x" : "";

  return `${MAPBOX_STATIC_BASE}/${overlayStr}/${longitude},${latitude},${zoom}/${width}x${height}${retinaStr}?access_token=${MAPBOX_TOKEN}`;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Encodes a GeoJSON polygon coordinate ring as a Mapbox Static API path overlay.
 * Format: path-{strokeWidth}+{strokeColor}-{strokeOpacity}+{fillColor}-{fillOpacity}({encoded_polyline})
 *
 * Uses gold (#C2A661) for stroke and fill with 0.2 fill opacity for the shaded overlay.
 */
function encodeGeoFencePath(coords: [number, number][]): string {
  // Mapbox Static API accepts raw coordinate pairs in path syntax
  const coordStr = coords.map(([lng, lat]) => `[${lng},${lat}]`).join(",");
  // stroke: 2px gold (#C2A661) at 0.8 opacity, fill: gold at 0.2 opacity
  return `path-2+C2A661-0.8+C2A661-0.2(${encodeURIComponent(coordStr)})`;
}
