"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { SplitViewLayout } from "@/components/search/split-view-layout";
import { SearchFilterBar } from "@/components/search/search-filter-bar";
import { getPropertiesForMap } from "@/app/actions/map-actions";
import { searchProperties, getAvailableAreas } from "@/app/actions/search-actions";
import { useSearchFilters } from "@/hooks/use-search-filters";
import type { MapProperty } from "@/app/actions/map-actions";
import type { PropertySearchItem, FilterFacets } from "@/types/search";

type ViewMode = "split" | "map" | "grid";

type MapBounds = { north: number; south: number; east: number; west: number };

export function SearchPageClient() {
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = typeof params.locale === "string" ? params.locale : "en";

  const rawView = searchParams.get("view");
  const viewMode: ViewMode = rawView === "map" || rawView === "grid" ? rawView : "split";

  // Map properties — fetched by map-actions.ts (Story 3.2, unchanged)
  const [mapProperties, setMapProperties] = useState<MapProperty[]>([]);

  // Filter search results — fetched by search-actions.ts (Story 3.3)
  const [filterProperties, setFilterProperties] = useState<PropertySearchItem[]>([]);
  const [facets, setFacets] = useState<FilterFacets>({
    byType: [],
    byBedrooms: [],
    byBathrooms: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  // Pagination state — ephemeral UI state, NOT in URL (architecture §8)
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Available areas for the area filter dropdown
  const [areas, setAreas] = useState<{ slug: string; label: string }[]>([]);

  // Monotonic sequence counters for race condition prevention
  // Using a single counter is fine since only one fetch at a time is needed
  const requestSeqRef = useRef(0);
  const filterSeqRef = useRef(0);

  // Read current filter state from URL (hook reads useSearchParams internally)
  const { filters } = useSearchFilters();

  // Initial load — fetch all visible properties with coordinates for the map
  useEffect(() => {
    let cancelled = false;
    getPropertiesForMap()
      .then((data) => {
        if (!cancelled) setMapProperties(data);
      })
      .catch((error) => {
        // Server Action failure — log and leave the property list empty
        console.error("[search] initial getPropertiesForMap failed", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Initial load — fetch available areas for the location filter
  useEffect(() => {
    getAvailableAreas()
      .then((data) => setAreas(data))
      .catch((error) => {
        console.error("[search] getAvailableAreas failed", error);
      });
  }, []);

  // Track the previous filter snapshot so a filter-change can reset page to 1
  // without firing a second fetch from a separate effect (avoids double fetch
  // and the brief stale-page request that the old two-effect pattern caused).
  const prevFiltersRef = useRef(filters);

  // Re-fetch filter results when filters or page changes.
  // The useSearchFilters hook reads from useSearchParams, so this effect
  // reacts whenever any filter URL param changes.
  useEffect(() => {
    const filtersChanged = prevFiltersRef.current !== filters;
    prevFiltersRef.current = filters;

    // When filters change, reset the page state to 1 and use 1 for THIS
    // fetch (state update is async — using page directly here would still
    // hit the server with the old page number).
    const effectivePage = filtersChanged ? 1 : page;
    if (filtersChanged && page !== 1) {
      setPage(1);
    }

    const seq = ++filterSeqRef.current;
    setIsLoading(true);

    searchProperties(filters, effectivePage)
      .then((result) => {
        // Drop stale responses — only use the most recent request's result
        if (seq === filterSeqRef.current) {
          setFilterProperties(result.properties);
          setFacets(result.facets);
          setTotal(result.total);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error("[search] searchProperties failed", error);
        if (seq === filterSeqRef.current) {
          setIsLoading(false);
        }
      });
  }, [filters, page]);

  // Refresh map properties when map bounds change.
  // Uses a monotonically increasing sequence number to discard stale responses.
  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    const seq = ++requestSeqRef.current;
    getPropertiesForMap(bounds)
      .then((data) => {
        if (seq === requestSeqRef.current) {
          setMapProperties(data);
        }
      })
      .catch((error) => {
        console.error("[search] bounds-change getPropertiesForMap failed", error);
      });
  }, []);

  return (
    <div className="flex flex-col overscroll-none">
      <SearchFilterBar facets={facets} areas={areas} />
      <SplitViewLayout
        viewMode={viewMode}
        onViewModeChange={() => {
          // View mode changes are handled inside SplitViewLayout via ViewModeToggle
        }}
        properties={mapProperties}
        filterProperties={filterProperties}
        facets={facets}
        isLoading={isLoading}
        locale={locale}
        propertyCount={filterProperties.length || mapProperties.length}
        onBoundsChange={handleBoundsChange}
        total={total}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}
