"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { SplitViewLayout } from "@/components/search/split-view-layout";
import { SearchFilterBar } from "@/components/search/search-filter-bar";
import { getPropertiesForMap } from "@/app/actions/map-actions";
import type { MapProperty } from "@/app/actions/map-actions";

type ViewMode = "split" | "map" | "grid";

type MapBounds = { north: number; south: number; east: number; west: number };

export function SearchPageClient() {
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = typeof params.locale === "string" ? params.locale : "en";

  const rawView = searchParams.get("view");
  const viewMode: ViewMode = rawView === "map" || rawView === "grid" ? rawView : "split";

  const [properties, setProperties] = useState<MapProperty[]>([]);

  // Tracks the most recent bounds-change request so out-of-order responses
  // from earlier requests cannot overwrite a later one's results.
  const requestSeqRef = useRef(0);

  // Initial load — fetch all visible properties with coordinates
  useEffect(() => {
    let cancelled = false;
    getPropertiesForMap()
      .then((data) => {
        if (!cancelled) setProperties(data);
      })
      .catch((error) => {
        // Server Action failure (DB outage, schema mismatch, etc.) — log and
        // leave the property list empty rather than crashing the page.
        console.error("[search] initial getPropertiesForMap failed", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Refresh properties when map bounds change.
  // Uses a monotonically increasing sequence number to discard stale responses.
  // Wrapped in useCallback to avoid re-creating on every render, which would
  // cause SplitViewLayout to re-render unnecessarily (L-3).
  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    const seq = ++requestSeqRef.current;
    getPropertiesForMap(bounds)
      .then((data) => {
        // Drop the response if a newer bounds-change request has been issued.
        if (seq === requestSeqRef.current) {
          setProperties(data);
        }
      })
      .catch((error) => {
        console.error("[search] bounds-change getPropertiesForMap failed", error);
      });
  }, []);

  return (
    <div className="flex flex-col">
      <SearchFilterBar />
      <SplitViewLayout
        viewMode={viewMode}
        onViewModeChange={() => {
          // View mode changes are handled inside SplitViewLayout via ViewModeToggle
        }}
        properties={properties}
        locale={locale}
        propertyCount={properties.length}
        onBoundsChange={handleBoundsChange}
      />
    </div>
  );
}
