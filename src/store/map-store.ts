/**
 * Story 3.2: Zustand map state store
 *
 * IMPORTANT: This file MUST NOT have the use-client directive.
 * Zustand stores are plain TypeScript modules — the directive belongs
 * only on React component files that import the store.
 *
 * Default center: { lng: -83.70, lat: 9.38 } — geographic midpoint between
 * Pérez Zeledón and Dominical/Uvita in southern Costa Rica.
 * Default zoom: 10
 *
 * @see _bmad-output/implementation-artifacts/3-2-interactive-map-with-property-pins.md Task 2
 */

import { create } from "zustand";

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

export const useMapStore = create<MapStore>()((set) => ({
  center: { lng: -83.7, lat: 9.38 },
  zoom: 10,
  bounds: null,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setBounds: (bounds) => set({ bounds }),
}));
