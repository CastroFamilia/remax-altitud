/**
 * Story 3.2: Mapbox configuration
 *
 * Central place for Mapbox token, style, default viewport, and bounds.
 * NEXT_PUBLIC prefix ensures this env var is available on the client side.
 *
 * @see _bmad-output/implementation-artifacts/3-2-interactive-map-with-property-pins.md Task 3
 */

import type { LngLatBoundsLike } from "mapbox-gl";

/** Mapbox public token — required for all Mapbox GL JS calls. */
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

/** Geographic midpoint between Pérez Zeledón and Dominical/Uvita. */
export const DEFAULT_MAP_CENTER = { lng: -83.7, lat: 9.38 };

/** Default zoom level — shows southern Costa Rica region at comfortable scale. */
export const DEFAULT_MAP_ZOOM = 10;

/**
 * Mapbox Outdoors style — shows terrain contours, forest cover, and roads.
 * Ideal for southern Costa Rica's mountainous/coastal geography.
 */
export const MAP_STYLE = "mapbox://styles/mapbox/outdoors-v12";

/**
 * Max bounds — tightly fits the southern Costa Rica region.
 * Prevents users from panning off the coverage area.
 * Format: [[west, south], [east, north]]
 */
export const MAX_BOUNDS: LngLatBoundsLike = [
  [-86.0, 7.5],
  [-81.5, 11.5],
];
