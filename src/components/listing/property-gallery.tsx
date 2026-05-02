'use client';

/**
 * PropertyGallery — RED PHASE STUB
 *
 * This is a scaffold stub for Story 4.1 ATDD.
 * The tests in tests/unit/listing/property-gallery.spec.tsx are written against
 * the EXPECTED behavior of the real implementation.
 *
 * All tests are currently in it.skip() (TDD red phase).
 *
 * Implementation task: Story 4.1, Task 2
 * See: _bmad-output/implementation-artifacts/4-1-listing-detail-page-and-photo-gallery.md
 */

// TODO Story 4.1 Task 2: Implement PropertyGallery
// - Hero gallery fills full-width at 60vh (data-testid="gallery-hero")
// - Thumbnail strip (data-testid="gallery-thumbnail-strip")
// - Photo count overlay (data-testid="gallery-photo-count")
// - Fullscreen lightbox via Radix UI Dialog (data-testid="gallery-lightbox")
// - Arrow key navigation (ArrowLeft/ArrowRight) in lightbox
// - Swipe navigation via @use-gesture/react useDrag
// - YouTube video embed (data-testid="gallery-video-embed") when youtubeUrl provided
// - LQIP blur placeholder: next/image with placeholder="blur" + blurDataURL
// - First image has priority prop for LCP optimization

import type { OptimizedImage } from '@/types/images';

interface PropertyGalleryProps {
  images: OptimizedImage[];
  youtubeUrl?: string | null;
  propertyTitle: string;
}

export function PropertyGallery(_props: PropertyGalleryProps) {
  // STUB — replace with full implementation for Story 4.1
  return null;
}

export default PropertyGallery;
