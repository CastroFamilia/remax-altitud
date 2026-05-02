'use client';

/**
 * StickySpecsBar — RED PHASE STUB
 *
 * This is a scaffold stub for Story 4.1 ATDD.
 * The tests in tests/unit/listing/sticky-specs-bar.spec.tsx are written against
 * the EXPECTED behavior of the real implementation.
 *
 * All tests are currently in it.skip() (TDD red phase).
 *
 * Implementation task: Story 4.1, Task 5
 * See: _bmad-output/implementation-artifacts/4-1-listing-detail-page-and-photo-gallery.md
 */

// TODO Story 4.1 Task 5: Implement StickySpecsBar
// - data-testid="sticky-specs-bar" on root element
// - position: sticky (Tailwind: sticky top-0)
// - Shows: price (formatUSD), beds/baths, lot + built area (convertArea from useLocaleUnits)
// - ZMT status badge
// - UnitToggle component for m²/ft² toggle
// - Uses useLocaleUnits hook (init with defaultSystem, reconcile in useEffect — SSR safety)

interface StickySpecsBarProps {
  priceUsd: number;
  bedrooms: number | null;
  bathrooms: number | null;
  lotSizeM2: number | null;
  constructionM2: number | null;
  zmtStatus: string;
  locale: string;
}

export function StickySpecsBar(_props: StickySpecsBarProps) {
  // STUB — replace with full implementation for Story 4.1
  return null;
}

export default StickySpecsBar;
