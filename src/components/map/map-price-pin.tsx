"use client";

/**
 * Story 3.2: MapPricePin — individual property price pill marker.
 *
 * Renders an abbreviated price pill. Background changes based on selection state:
 *   - Unselected: bg-brand-navy text-white
 *   - Selected:   bg-white text-brand-navy border-2 border-brand-navy
 *
 * @see _bmad-output/implementation-artifacts/3-2-interactive-map-with-property-pins.md Task 5
 */

import { formatPriceAbbrev } from "@/lib/map/geo-utils";
import { cn } from "@/lib/utils";

interface MapPricePinProps {
  price: number;
  isSelected: boolean;
  onClick: () => void;
}

export function MapPricePin({ price, isSelected, onClick }: MapPricePinProps) {
  const abbreviated = formatPriceAbbrev(price);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Property priced at ${abbreviated}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }
      }}
      className={cn(
        "px-2 py-1 rounded-full text-xs font-semibold shadow-md cursor-pointer min-w-[44px] text-center",
        isSelected
          ? "bg-white text-brand-navy border-2 border-brand-navy"
          : "bg-brand-navy text-white",
      )}
    >
      {abbreviated}
    </div>
  );
}
