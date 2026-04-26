import type React from "react";

/**
 * Story 3.2: MapViewLoader — next/dynamic wrapper for MapView
 *
 * RED PHASE STUB — implementation pending (Story 3.2 Task 7).
 * Replace with real implementation using next/dynamic in Task 7.
 *
 * This file MUST NOT have 'use client' — the dynamic import handles that.
 *
 * @see _bmad-output/implementation-artifacts/3-2-interactive-map-with-property-pins.md Task 7
 */

import type { MapProperty, MapBounds } from "./map-view";

interface MapViewProps {
  properties: MapProperty[];
  locale: string;
  onBoundsChange?: (bounds: MapBounds) => void;
}

/**
 * RED PHASE STUB — throws on render.
 * Real implementation uses: dynamic(() => import('./map-view'), { ssr: false })
 */
function MapView(_props: MapViewProps): React.ReactElement {
  throw new Error("MapViewLoader: not yet implemented (Story 3.2 Task 7)");
}

export { MapView };
