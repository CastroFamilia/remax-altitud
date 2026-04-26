'use client';

import type React from "react";

/**
 * Story 3.2: MapView — Mapbox interactive map component
 *
 * RED PHASE STUB — implementation pending (Story 3.2 Task 6).
 * This stub allows test files to be collected and run as skipped (it.skip).
 * Replace this with the real MapView implementation in Task 6.
 *
 * @see _bmad-output/implementation-artifacts/3-2-interactive-map-with-property-pins.md Task 6
 */

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type MapProperty = {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  priceUsd: number;
  bedrooms: number | null;
  bathrooms: number | null;
  lotSizeM2: number | null;
  zmtStatus: string;
  images: { url: string; alt?: string }[];
  latitude: number;
  longitude: number;
};

interface MapViewProps {
  properties: MapProperty[];
  locale: string;
  onBoundsChange?: (bounds: MapBounds) => void;
}

/**
 * RED PHASE STUB — throws on render to ensure tests using it.skip() fail immediately
 * when `it.skip` is removed before implementation.
 */
export function MapView(_props: MapViewProps): React.ReactElement {
  throw new Error("MapView: not yet implemented (Story 3.2 Task 6)");
}
