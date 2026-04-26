/**
 * Story 3.2: Map geo-utilities
 *
 * RED PHASE STUB — implementation pending (Story 3.2 Task 3).
 * These stubs allow test files to be collected and run as skipped (it.skip).
 * Replace these with real implementations in Task 3.
 *
 * @see _bmad-output/implementation-artifacts/3-2-interactive-map-with-property-pins.md Task 3
 */

// ViewStateChangeEvent imported from react-map-gl in the real implementation (Task 3).
// Using a compatible structural type here to avoid import errors in the RED phase stub.
type ViewStateChangeEvent = {
  target: {
    getBounds: () => {
      getNorth: () => number;
      getSouth: () => number;
      getEast: () => number;
      getWest: () => number;
    };
  };
};

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
  throw new Error("boundsFromMapboxEvent: not yet implemented (Story 3.2 Task 3)");
}

/**
 * Formats a USD price as abbreviated string:
 *   ≥1,000,000 → "$1.2M"
 *   ≥1,000     → "$250K"
 *   <1,000     → "$500"
 */
export function formatPriceAbbrev(price: number): string {
  throw new Error("formatPriceAbbrev: not yet implemented (Story 3.2 Task 3)");
}
