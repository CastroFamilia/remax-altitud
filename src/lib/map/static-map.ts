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
 *
 * NOTE: "server-only" was intentionally removed — this module is a pure URL
 * builder that uses the public NEXT_PUBLIC_MAPBOX_TOKEN.  CommunityCard (which
 * calls buildAreaThumbnailMapUrl) is imported by SimilarCommunitiesSlider, a
 * "use client" component, so the module graph must be client-compatible.
 */

import { MAPBOX_TOKEN } from "@/lib/map/config";

const MAPBOX_STATIC_BASE = "https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static";

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
  return buildStaticMapUrl({
    latitude: options.latitude,
    longitude: options.longitude,
    geoFenceCoords: options.geoFenceCoords,
    zoom: options.zoom ?? 13,
    width: options.width ?? 600,
    height: options.height ?? 400,
    retina: options.retina ?? true,
  });
}

/**
 * Builds a smaller Mapbox Static Images API URL for community card thumbnails.
 * Used in area guide pages for community cards (AC #3).
 */
export function buildAreaThumbnailMapUrl(options: ThumbnailMapOptions): string {
  return buildStaticMapUrl({
    latitude: options.latitude,
    longitude: options.longitude,
    geoFenceCoords: options.geoFenceCoords,
    zoom: options.zoom ?? 11,
    width: options.width ?? 300,
    height: options.height ?? 200,
    retina: options.retina ?? true,
  });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface StaticMapParams {
  latitude: number;
  longitude: number;
  geoFenceCoords?: [number, number][] | null;
  zoom: number;
  width: number;
  height: number;
  retina: boolean;
}

/**
 * Shared builder — constructs a Mapbox Static Images API URL with
 * an optional geo-fence GeoJSON polygon overlay and a pin marker.
 */
function buildStaticMapUrl(params: StaticMapParams): string {
  const { latitude, longitude, geoFenceCoords, zoom, width, height, retina } = params;

  const overlays: string[] = [];
  const hasPolygon = geoFenceCoords && geoFenceCoords.length >= 3;

  // Geo-fence polygon overlay using Mapbox GeoJSON overlay format
  // (simplestyle-spec properties for stroke/fill styling)
  if (hasPolygon) {
    overlays.push(encodeGeoFencePath(geoFenceCoords));
  }

  // Community center pin marker (gold color #C2A661)
  overlays.push(`pin-l+C2A661(${longitude},${latitude})`);

  const overlayStr = overlays.join(",");
  const retinaStr = retina ? "@2x" : "";

  // When a polygon overlay is present, use 'auto' viewport so Mapbox
  // automatically fits all overlays (polygon + pin) in the rendered image.
  // Fall back to fixed center + zoom for pin-only maps.
  const viewport = hasPolygon ? "auto" : `${longitude},${latitude},${zoom}`;

  const paddingParam = hasPolygon ? "&padding=40" : "";

  return `${MAPBOX_STATIC_BASE}/${overlayStr}/${viewport}/${width}x${height}${retinaStr}?access_token=${MAPBOX_TOKEN}${paddingParam}`;
}

/**
 * Encodes a GeoJSON polygon coordinate ring as a Mapbox Static API GeoJSON overlay.
 *
 * Uses the `geojson()` overlay format with simplestyle-spec properties for
 * stroke and fill styling. Gold (#C2A661) stroke at 0.8 opacity, gold fill at 0.2 opacity.
 *
 * @see https://docs.mapbox.com/api/maps/static-images/#overlay-options
 */
function encodeGeoFencePath(coords: [number, number][]): string {
  // Reduce coordinate precision to 5 decimal places (~1.1m accuracy)
  // to keep the encoded URL compact and well within Mapbox's 8,192 char limit.
  const trimmed = coords.map(
    ([lng, lat]) => [parseFloat(lng.toFixed(5)), parseFloat(lat.toFixed(5))] as [number, number],
  );

  // Ensure the polygon ring is closed (first === last coordinate)
  const ring =
    trimmed.length > 0 &&
    (trimmed[0][0] !== trimmed[trimmed.length - 1][0] ||
      trimmed[0][1] !== trimmed[trimmed.length - 1][1])
      ? [...trimmed, trimmed[0]]
      : trimmed;

  const geojson = {
    type: "Feature" as const,
    properties: {
      stroke: "#C2A661",
      "stroke-width": 2,
      "stroke-opacity": 0.8,
      fill: "#C2A661",
      "fill-opacity": 0.2,
    },
    geometry: {
      type: "Polygon" as const,
      coordinates: [ring],
    },
  };

  return `geojson(${encodeURIComponent(JSON.stringify(geojson))})`;
}
