/**
 * Shared type definition for optimized property images.
 * This file is intentionally NOT a server-only module — it is a pure type
 * definition shared between server-side pipeline code and client components.
 */

export interface OptimizedImage {
  /** Relative URL to the 400w WebP variant: "/property-images/{apiId}/{base}-400w.webp" */
  src: string;
  /** Responsive image srcset: "…400w.webp 400w, …800w.webp 800w, …1600w.webp 1600w" */
  srcset?: string;
  /** Base64 data URI for the LQIP blur placeholder (20px wide WebP) */
  blurDataUrl?: string;
  /** Fixed literal: src always points to the 400w variant */
  width?: number;
  /** Pixel height of the 400w variant (aspect-ratio preserved) */
  height?: number;
  /** Alt text following the template: "Photo {n} of {total} — {propertyType} in {location}" */
  alt?: string;
}
