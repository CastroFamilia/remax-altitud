"use client";

import { useEffect, useState } from "react";
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

  // Initial load — fetch all visible properties with coordinates
  useEffect(() => {
    let cancelled = false;
    getPropertiesForMap().then((data) => {
      if (!cancelled) setProperties(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Refresh properties when map bounds change
  function handleBoundsChange(bounds: MapBounds) {
    getPropertiesForMap(bounds).then((data) => {
      setProperties(data);
    });
  }

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
