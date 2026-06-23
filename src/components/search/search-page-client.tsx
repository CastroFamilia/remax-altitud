"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { SplitViewLayout } from "@/components/search/split-view-layout";
import { SearchFilterBar } from "@/components/search/search-filter-bar";
import { getPropertiesForMap } from "@/app/actions/map-actions";
import { searchProperties, getAvailableAreas } from "@/app/actions/search-actions";
import { useSearchFilters } from "@/hooks/use-search-filters";
import type { MapProperty, MapFilters } from "@/app/actions/map-actions";
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
  const [areas, setAreas] = useState<
    { slug: string; label: string; parentSlug?: string; isSubLocation?: boolean }[]
  >([]);

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

  // Build mapFilters from the full search filters so the map query applies the
  // same dimensions as the grid (fixes split view showing mismatched results).
  const mapFilters: MapFilters | undefined = useMemo(() => {
    const hasAnyFilter =
      filters.type ||
      filters.listingType ||
      filters.priceMin !== undefined ||
      filters.priceMax !== undefined ||
      filters.bedrooms !== undefined ||
      filters.bathrooms !== undefined ||
      filters.lotSizeMin !== undefined ||
      filters.lotSizeMax !== undefined ||
      filters.areaSlug ||
      filters.subLocation ||
      (filters.tags && filters.tags.length > 0) ||
      filters.q ||
      filters.region;
    if (!hasAnyFilter) return undefined;
    return {
      type: filters.type,
      listingType: filters.listingType,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      bedrooms: filters.bedrooms,
      bathrooms: filters.bathrooms,
      lotSizeMin: filters.lotSizeMin,
      lotSizeMax: filters.lotSizeMax,
      areaSlug: filters.areaSlug,
      subLocation: filters.subLocation,
      tags: filters.tags,
      q: filters.q,
      region: filters.region,
    };
  }, [filters]);

  // Keep a ref to the latest mapFilters so the handleBoundsChange callback
  // always sees the current value without needing to be re-created.
  const mapFiltersRef = useRef(mapFilters);
  mapFiltersRef.current = mapFilters;

  const prevMapFiltersRef = useRef(mapFilters);
  const isFirstLoadRef = useRef(true);

  // Fetch map properties whenever filters change (and on initial load).
  // This ensures map pins update when the user selects any filter.
  useEffect(() => {
    let cancelled = false;
    const seq = ++requestSeqRef.current;

    const isFirstLoad = isFirstLoadRef.current;
    isFirstLoadRef.current = false;
    const isFilterChange = prevMapFiltersRef.current !== mapFilters || isFirstLoad;
    prevMapFiltersRef.current = mapFilters;

    getPropertiesForMap(undefined, mapFilters)
      .then((data) => {
        if (!cancelled && seq === requestSeqRef.current) {
          setMapProperties(data);

          if (isFilterChange && data.length > 0) {
            let minLat = 90,
              maxLat = -90,
              minLng = 180,
              maxLng = -180;
            data.forEach((p) => {
              if (p.latitude < minLat) minLat = p.latitude;
              if (p.latitude > maxLat) maxLat = p.latitude;
              if (p.longitude < minLng) minLng = p.longitude;
              if (p.longitude > maxLng) maxLng = p.longitude;
            });

            // If it's just a single point or exactly overlapping points, we can't fit bounds well
            if (minLat === maxLat && minLng === maxLng) {
              setFlyToTarget({ lat: minLat, lng: minLng, zoom: 14 });
            } else {
              setFitBoundsTarget([
                [minLng, minLat],
                [maxLng, maxLat],
              ]);
            }
          }
        }
      })
      .catch((error) => {
        console.error("[search] getPropertiesForMap failed", error);
      });
    return () => {
      cancelled = true;
    };
  }, [mapFilters]);

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

  // Update bounds state when the map viewport changes.
  // Map property fetching is handled by the unified effect above
  // (which reacts to bounds AND filter changes).
  const handleBoundsChange = useCallback((newBounds: MapBounds) => {
    setBoundsState(newBounds);
  }, []);

  // Near Me handlers — lifted here to pass into SearchFilterBar
  // while SplitViewLayout still uses the flyToTarget state.
  const [flyToTarget, setFlyToTarget] = useState<{
    lat: number;
    lng: number;
    zoom?: number;
  } | null>(null);
  const [fitBoundsTarget, setFitBoundsTarget] = useState<
    [[number, number], [number, number]] | null
  >(null);
  const [nearMeFallbackMessage, setNearMeFallbackMessage] = useState<string | null>(null);

  const handleNearMeSuccess = useCallback((coords: { lat: number; lng: number }) => {
    setFlyToTarget({ ...coords, zoom: 13 });
    setNearMeFallbackMessage(null);
  }, []);

  const handleNearMeFallback = useCallback(
    (coords: { lat: number; lng: number }, message: string) => {
      setFlyToTarget({ ...coords, zoom: 11 });
      setNearMeFallbackMessage(message);
    },
    [],
  );

  return (
    <div className="flex flex-col overflow-hidden overscroll-none h-[calc(100vh-var(--header-height))]">
      <SearchFilterBar
        facets={facets}
        areas={areas}
        locale={locale}
        onNearMeSuccess={handleNearMeSuccess}
        onNearMeFallback={handleNearMeFallback}
        resultCount={total}
      />
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
        flyToTarget={flyToTarget}
        fitBoundsTarget={fitBoundsTarget}
        nearMeFallbackMessage={nearMeFallbackMessage}
        onDismissFallback={() => setNearMeFallbackMessage(null)}
      />
    </div>
  );
}
