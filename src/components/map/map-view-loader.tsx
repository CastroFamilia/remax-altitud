/**
 * Story 3.2: MapViewLoader — next/dynamic wrapper for MapView.
 *
 * This file MUST NOT have 'use client' — the dynamic import handles that.
 * Ensures Mapbox GL JS (~230KB) is NOT included in the main bundle (AR25, R-001).
 * The loading fallback retains data-testid="map-container" so tests pass during load.
 *
 * IMPORTANT: Always use this file as the MapView entry point — never directly from ./map-view.
 *
 * @see _bmad-output/implementation-artifacts/3-2-interactive-map-with-property-pins.md Task 7
 */

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./map-view").then((m) => ({ default: m.MapView })), {
  ssr: false,
  loading: () => (
    <div data-testid="map-container" className="h-full w-full bg-muted animate-pulse" />
  ),
});

/**
 * MapViewLoader — lazy-loaded PinDropMap for the seller form LocationPicker (Story 5.1).
 * Exported as a named export so location-picker.tsx can mock it in tests via:
 *   vi.mock('@/components/map/map-view-loader', () => ({ MapViewLoader: ... }))
 */
const MapViewLoader = dynamic(
  () => import("./pin-drop-map").then((m) => ({ default: m.PinDropMap })),
  {
    ssr: false,
    loading: () => (
      <div data-testid="location-map" className="h-64 w-full bg-muted rounded-lg animate-pulse" />
    ),
  },
);

export { MapView, MapViewLoader };
