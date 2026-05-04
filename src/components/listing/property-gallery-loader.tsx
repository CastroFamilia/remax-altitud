"use client";

/**
 * PropertyGalleryLoader — Client Component wrapper using next/dynamic (ssr: false).
 *
 * This is a thin Client Component wrapper that lazy-loads PropertyGallery.
 * The 'use client' directive is required because next/dynamic with ssr: false
 * can only be called from Client Component context (Turbopack constraint).
 *
 * Ensures the gallery's interactive code (~25KB) is NOT included in the initial
 * SSG page bundle (Architecture performance budget, R-002, 4.1-UNIT-001).
 *
 * IMPORTANT: Import this from ListingDetailLayout (Server Component) — NOT
 * property-gallery.tsx directly.
 *
 * Story 4.1, Task 2 — pattern mirrors MapViewLoader (Story 3.2).
 */

import dynamic from "next/dynamic";
import type { OptimizedImage } from "@/types/images";

interface PropertyGalleryLoaderProps {
  images: OptimizedImage[];
  youtubeUrl?: string | null;
  propertyTitle: string;
}

const PropertyGalleryDynamic = dynamic(
  () =>
    import("@/components/listing/property-gallery").then((m) => ({
      default: m.PropertyGallery,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        data-testid="gallery-hero"
        className="relative w-full aspect-[4/3] bg-gray-200 animate-pulse"
      />
    ),
  },
);

export function PropertyGalleryLoader(props: PropertyGalleryLoaderProps) {
  return <PropertyGalleryDynamic {...props} />;
}
