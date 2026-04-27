"use client";

/**
 * Story 3.3: Search Filters & URL State
 * Component: PriceRangeSlider — dual-handle Radix Slider for price range.
 *
 * ATDD STUB — This file satisfies module resolution for red-phase test scaffolds.
 * Task 5 of Story 3.3 will replace this stub with the full implementation.
 */

interface PriceRangeSliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

/**
 * ATDD STUB — Not yet implemented. Story 3.3 Task 5 will implement this.
 *
 * Implementation requirements:
 * - Import Slider from "@radix-ui/react-slider" (NOT "radix-ui" unified package)
 * - data-testid="price-range-slider" on root div
 * - Two number inputs for min/max price (sync with slider)
 * - Format prices using formatPriceAbbrev from @/lib/map/geo-utils
 * - Slider thumbs must be w-[44px] h-[44px] (UX-DR7 touch targets)
 * - Default: min=0, max=5_000_000, step=10_000
 */
export function PriceRangeSlider(_props: PriceRangeSliderProps) {
  throw new Error("PriceRangeSlider: not yet implemented — Story 3.3 Task 5");
}
