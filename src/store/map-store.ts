/**
 * Story 3.2: Zustand map state store
 *
 * RED PHASE STUB — implementation pending (Story 3.2 Task 2).
 * This stub allows test files to be collected and run as skipped (it.skip).
 * Replace this with the real Zustand store in Task 2.
 *
 * IMPORTANT: This file MUST NOT have a 'use client' directive.
 * Zustand stores are plain TypeScript modules — 'use client' belongs
 * only on React component files that import the store.
 *
 * @see _bmad-output/implementation-artifacts/3-2-interactive-map-with-property-pins.md Task 2
 */

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type MapStore = {
  center: { lng: number; lat: number };
  zoom: number;
  bounds: MapBounds | null;
  setCenter: (center: { lng: number; lat: number }) => void;
  setZoom: (zoom: number) => void;
  setBounds: (bounds: MapBounds) => void;
};

/**
 * Zustand map store hook.
 * Default center: { lng: -83.70, lat: 9.38 } — midpoint Pérez Zeledón / Dominical
 * Default zoom: 10
 *
 * RED PHASE: This is a stub. The real implementation uses zustand's create<MapStore>().
 */
export const useMapStore = Object.assign(
  () => {
    throw new Error("useMapStore: not yet implemented (Story 3.2 Task 2)");
  },
  {
    getState: (): MapStore => {
      throw new Error("useMapStore.getState: not yet implemented (Story 3.2 Task 2)");
    },
  },
) as unknown as {
  (): MapStore;
  getState: () => MapStore;
};
