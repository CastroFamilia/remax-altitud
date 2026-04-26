/**
 * Story 3.2: Map geo-utilities
 *
 * Pure functions for map bounds extraction and price formatting.
 *
 * @see _bmad-output/implementation-artifacts/3-2-interactive-map-with-property-pins.md Task 3
 */

import type { ViewStateChangeEvent } from "react-map-gl";

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

/**
 * Extracts MapBounds from a react-map-gl v7 ViewStateChangeEvent.
 * Uses event.target.getBounds() to get north/south/east/west.
 */
export function boundsFromMapboxEvent(event: ViewStateChangeEvent): MapBounds {
  const bounds = event.target.getBounds();
  if (!bounds) {
    throw new Error("Map bounds not available");
  }
  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  };
}

/**
 * Formats a USD price as abbreviated string:
 *   ≥1,000,000 → "$1.2M"
 *   ≥1,000     → "$250K"
 *   <1,000     → "$500"
 *
 * Uses 999,500 as the K→M boundary so that Math.round(price/1000) === 1000
 * cases (e.g. $999,500) display as "$1.0M" rather than the invalid "$1000K".
 */
export function formatPriceAbbrev(price: number): string {
  if (price >= 1_000_000) {
    return `$${(price / 1_000_000).toFixed(1)}M`;
  }
  // Treat values that would round to 1000K as ≥1M to avoid "$1000K" output.
  if (price >= 999_500) {
    return `$${(price / 1_000_000).toFixed(1)}M`;
  }
  if (price >= 1_000) {
    return `$${Math.round(price / 1_000)}K`;
  }
  return `$${price}`;
}
