"use client";

/**
 * Story 3.2: MapClusterPin — circular cluster badge marker.
 *
 * Renders a circular badge showing the count of clustered properties.
 * Touch target: w-10 h-10 (40px × 40px) — meets UX-DR7 (≥44px) requirement
 * via the min-w-[44px] min-h-[44px] wrapper.
 *
 * @see _bmad-output/implementation-artifacts/3-2-interactive-map-with-property-pins.md Task 5
 */

interface MapClusterPinProps {
  count: number;
  onClick: () => void;
}

export function MapClusterPin({ count, onClick }: MapClusterPinProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Cluster of ${count} properties`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="w-10 h-10 rounded-full bg-brand-navy text-white text-sm font-bold flex items-center justify-center shadow-md cursor-pointer min-w-[44px] min-h-[44px]"
    >
      {count}
    </div>
  );
}
