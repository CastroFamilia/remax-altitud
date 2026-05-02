"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SearchResultsSkeleton } from "@/components/search/search-results-skeleton";
import { ViewModeToggle } from "@/components/search/view-mode-toggle";
import { MapView } from "@/components/map/map-view-loader";
import { PropertyGrid } from "@/components/property/property-grid";
import { MapPullUpSheet } from "@/components/map/map-pull-up-sheet";
import { UnitToggle } from "@/components/layout/unit-toggle";
import { NearMeButton } from "@/components/search/near-me-button";
import { useLocaleUnits } from "@/hooks/use-locale-units";
import type { MapBounds } from "@/store/map-store";
import type { PropertySearchItem, FilterFacets, SearchFilters } from "@/types/search";

type ViewMode = "split" | "map" | "grid";

export type MapProperty = {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  priceUsd: number;
  bedrooms: number | null;
  bathrooms: number | null;
  lotSizeM2: number | null;
  zmtStatus: string;
  images: { url: string; alt?: string }[];
  latitude: number;
  longitude: number;
};

interface SplitViewLayoutProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  properties?: MapProperty[];
  locale?: string;
  propertyCount?: number;
  onBoundsChange?: (bounds: MapBounds) => void;
  /** Filter search results (Story 3.3) */
  filterProperties?: PropertySearchItem[];
  /** Facet counts for filter labels (Story 3.3) */
  facets?: FilterFacets;
  /** Whether a filter search is in flight (Story 3.3) */
  isLoading?: boolean;
  /** Total result count for pagination (Story 3.5) */
  total?: number;
  /** Current page for pagination (Story 3.5) */
  page?: number;
  /** Page change callback for pagination (Story 3.5) */
  onPageChange?: (page: number) => void;
  /** Story 3.8: Active search filters to forward to PropertyGrid for NoResultsState */
  filters?: SearchFilters;
}

export function SplitViewLayout({
  viewMode,
  onViewModeChange,
  properties = [],
  locale = "en",
  propertyCount,
  onBoundsChange,
  filterProperties,
  // facets prop accepted for forward-compat (Story 3.5 reads it for card-level
  // filter counts). Not consumed yet — kept in the type to avoid breaking the
  // SearchPageClient call site when Story 3.5 lands.
  facets: _facets,
  isLoading = false,
  total,
  page,
  onPageChange,
  filters,
}: SplitViewLayoutProps) {
  // Suppress unused-var warnings for forward-compat props; they are part of
  // the public API surface used by SearchPageClient today.
  void _facets;
  // Unit preference (localStorage-persisted)
  const { unitSystem } = useLocaleUnits(locale);
  // Tablet side-panel toggle state
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  // Story 3.8: Near Me — fly-to target and fallback message
  const [flyToTarget, setFlyToTarget] = useState<{
    lat: number;
    lng: number;
    zoom?: number;
  } | null>(null);
  const [nearMeFallbackMessage, setNearMeFallbackMessage] = useState<string | null>(null);
  const tSidePanel = useTranslations("SearchPage.sidePanel");
  const tNearMe = useTranslations("NearMe");
  const mapHidden = viewMode === "grid";
  const gridHidden = viewMode === "map";

  const count = propertyCount ?? filterProperties?.length ?? properties.length;

  function handleBoundsChange(bounds: MapBounds) {
    onBoundsChange?.(bounds);
  }

  return (
    <div className="relative flex flex-col">
      {/* View mode + unit toggle row — desktop/tablet only, hidden on mobile.
          The outer wrapper provides the full-width border-b and bg-background so
          the bottom border spans the entire toolbar width (ViewModeToggle's own
          inner border-b only extends to its content width). */}
      <div className="hidden lg:flex items-center justify-between border-b border-border bg-background">
        <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        <div className="flex items-center gap-2 px-4 py-2">
          <NearMeButton
            onLocationSuccess={(coords) => {
              setFlyToTarget({ ...coords, zoom: 13 });
              setNearMeFallbackMessage(null);
            }}
            onLocationFallback={(coords, message) => {
              setFlyToTarget({ ...coords, zoom: 11 });
              setNearMeFallbackMessage(message);
            }}
          />
          <UnitToggle locale={locale} />
        </div>
      </div>

      {/* Story 3.8: Near Me fallback notification banner */}
      {nearMeFallbackMessage && (
        <div
          role="status"
          aria-live="polite"
          data-testid="near-me-fallback-message"
          className="flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2"
        >
          <span>{nearMeFallbackMessage}</span>
          <button
            type="button"
            aria-label={tNearMe("fallbackDismiss")}
            onClick={() => setNearMeFallbackMessage(null)}
            className="ml-4 text-amber-600 hover:text-amber-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Split-view container */}
      <div className="relative flex flex-row">
        {/* Map panel */}
        <div
          data-testid="map-panel"
          className={cn(
            // Mobile: full width map (no-prefix = mobile-first)
            "w-full",
            // Desktop split / full-map / full-grid
            mapHidden ? "lg:hidden" : gridHidden ? "lg:w-full" : "lg:w-[60%]",
            // Height:
            //   Mobile (<md): viewport minus header (var) minus mobile filter bar (h-12 = 3rem)
            //                  — keeps map flush with filter bar above and pull-up handle below.
            //   Desktop (≥lg): viewport minus header minus desktop filter bar (h-14 = 3.5rem).
            "h-[calc(100vh-var(--header-height)-3rem)]",
            "lg:h-[calc(100vh-var(--header-height)-3.5rem)]",
            "flex-shrink-0",
          )}
        >
          <MapView
            properties={properties}
            locale={locale}
            onBoundsChange={handleBoundsChange}
            flyToTarget={flyToTarget}
          />
        </div>

        {/* Grid panel — hidden on mobile, shown on desktop */}
        <div
          data-testid="grid-panel"
          className={cn(
            // Mobile: hidden (map is full-screen; pull-up sheet is Story 3.6)
            "hidden",
            // Tablet (md): 40% width, hidden behind side-panel toggle
            sidePanelOpen ? "md:block md:w-[40%]" : "md:hidden",
            // Desktop: show in split/grid mode, hide in full-map mode
            gridHidden ? "lg:hidden" : mapHidden ? "lg:w-full lg:block" : "lg:w-[40%] lg:block",
            "overflow-y-auto",
            "lg:h-[calc(100vh-var(--header-height)-3.5rem)]",
          )}
        >
          {/* Story 3.5: render PropertyGrid when filterProperties provided, else skeleton */}
          {filterProperties ? (
            <PropertyGrid
              properties={filterProperties}
              locale={locale}
              isLoading={isLoading}
              total={total}
              page={page}
              onPageChange={onPageChange}
              unitSystem={unitSystem}
              filters={filters}
            />
          ) : (
            <SearchResultsSkeleton />
          )}
        </div>

        {/* Tablet side-panel toggle button (md: range) */}
        <button
          type="button"
          aria-expanded={sidePanelOpen}
          aria-label={sidePanelOpen ? tSidePanel("hide") : tSidePanel("show")}
          className="absolute right-2 top-2 z-20 hidden md:flex lg:hidden items-center justify-center h-10 w-10 rounded-full bg-background shadow-md border border-border"
          onClick={() => setSidePanelOpen((prev) => !prev)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </button>
      </div>

      {/* Mobile pull-up sheet — Story 3.6 */}
      <MapPullUpSheet
        properties={filterProperties ?? []}
        locale={locale}
        propertyCount={count}
        isLoading={isLoading}
        unitSystem={unitSystem}
      />
    </div>
  );
}
