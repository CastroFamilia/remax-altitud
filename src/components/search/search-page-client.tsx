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
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return rawView === "map" || rawView === "grid" ? rawView : "split";
  });

  // Sync viewMode state when URL search parameters change (e.g. browser navigation)
  useEffect(() => {
    const currentView = searchParams.get("view");
    const mode: ViewMode = currentView === "map" || currentView === "grid" ? currentView : "split";
    setViewMode(mode);
  }, [searchParams]);

  // Map properties — fetched by map-actions.ts (Story 3.2, unchanged)
  const [mapProperties, setMapProperties] = useState<MapProperty[]>([]);

  // Filter search results — fetched by search-actions.ts (Story 3.3)
  const [filterProperties, setFilterProperties] = useState<PropertySearchItem[]>([]);
  const [bounds, setBoundsState] = useState<MapBounds | null>(null);
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

  // Lock viewport height and hide global footer on Mount to provide a professional, full-screen map experience
  useEffect(() => {
    document.body.classList.add("no-footer");
    return () => {
      document.body.classList.remove("no-footer");
    };
  }, []);

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

  // Re-fetch filter results when filters, page, or bounds changes.
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

    const isMapVisible = viewMode === "split" || viewMode === "map";
    const activeBounds = isMapVisible ? bounds : null;

    searchProperties(filters, effectivePage, activeBounds ?? undefined)
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
  }, [filters, page, bounds, viewMode]);

  // Refresh map properties when map bounds change.
  // Uses a monotonically increasing sequence number to discard stale responses.
  const handleBoundsChange = useCallback((newBounds: MapBounds) => {
    setBoundsState(newBounds);
    const seq = ++requestSeqRef.current;
    getPropertiesForMap(newBounds)
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
    <div className="flex flex-col overscroll-none h-[calc(100vh-var(--header-height))]">
      <SearchFilterBar facets={facets} areas={areas} />
      <SplitViewLayout
        viewMode={viewMode}
        onViewModeChange={setViewMode}
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
        filters={filters}
      />
    </div>
  );
}
