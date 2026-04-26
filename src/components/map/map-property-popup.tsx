'use client';

import type React from "react";

/**
 * Story 3.2: MapPropertyPopup — preview card shown when a property pin is tapped
 *
 * RED PHASE STUB — implementation pending (Story 3.2 Task 4).
 * Replace with real implementation in Task 4.
 *
 * @see _bmad-output/implementation-artifacts/3-2-interactive-map-with-property-pins.md Task 4
 */

interface MapPropertyPopupProps {
  property: {
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
  locale: string;
  onClose: () => void;
}

export function MapPropertyPopup(_props: MapPropertyPopupProps): React.ReactElement {
  throw new Error("MapPropertyPopup: not yet implemented (Story 3.2 Task 4)");
}
