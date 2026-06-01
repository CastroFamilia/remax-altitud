"use client";

/**
 * Story 3.3: Search Filters & URL State
 * Component: SearchFilterBar — redesigned with custom dropdown popovers.
 *
 * Preserved from Story 3.1 (must NOT break):
 * - data-testid="search-filter-bar" on root div
 * - className: sticky, top-[var(--header-height)], z-10, py-2, md:py-3
 * - className: bg-background, border-b, border-border
 * - data-testid="mobile-filters-button" on mobile button
 * - File starts with 'use client'
 *
 * Redesign changes:
 * - Native <select> → custom FilterDropdown (Radix Popover)
 * - Inline price slider → PriceFilterPopover (compact button trigger)
 * - Removed floating labels — dropdowns are self-descriptive
 * - Merged toolbar (ViewMode, Sort, NearMe, UnitToggle) into filter row
 * - Slimmer lifestyle tag chips
 */

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchFilters } from "@/hooks/use-search-filters";
import { FilterChips } from "@/components/search/filter-chips";
import { LifestyleTagChips } from "@/components/search/lifestyle-tag-chips";
import { PriceFilterPopover } from "@/components/search/price-filter-popover";
import { FilterDropdown } from "@/components/search/filter-dropdown";
import { ViewModeToggle } from "@/components/search/view-mode-toggle";
import { SortSelect } from "@/components/search/sort-select";
import { NearMeButton } from "@/components/search/near-me-button";
import { UnitToggle } from "@/components/layout/unit-toggle";
import { PriceRangeSlider } from "@/components/search/price-range-slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { FilterFacets } from "@/types/search";

/** Property types that are land/lot — hides bedrooms and bathrooms (AC #2) */
const LAND_TYPES = ["Lote", "Terreno", "Finca"];

const PROPERTY_TYPES = ["Casa", "Apartamento", "Lote", "Terreno", "Comercial", "Finca"];

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5];
const BATHROOM_OPTIONS = [1, 2, 3, 4];

type ViewMode = "split" | "map" | "grid";

interface SearchFilterBarProps {
  facets?: FilterFacets;
  areas?: { slug: string; label: string }[];
  /** View mode for the toolbar (from SplitViewLayout merge) */
  viewMode?: ViewMode;
  /** View mode change handler */
  onViewModeChange?: (mode: ViewMode) => void;
  /** Locale for UnitToggle */
  locale?: string;
  /** Near Me success handler — fly to user's location */
  onNearMeSuccess?: (coords: { lat: number; lng: number }) => void;
  /** Near Me fallback handler */
  onNearMeFallback?: (coords: { lat: number; lng: number }, message: string) => void;
  /** Result count to display in toolbar */
  resultCount?: number;
}

export function SearchFilterBar({
  facets,
  areas = [],
  viewMode = "split",
  onViewModeChange,
  locale = "en",
  onNearMeSuccess,
  onNearMeFallback,
  resultCount,
}: SearchFilterBarProps) {
  const t = useTranslations("SearchPage");
  const { filters, setFilter, clearFilter, clearAll, activeFilterCount, toggleTag } =
    useSearchFilters();

  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const isLandType = filters.type ? LAND_TYPES.includes(filters.type) : false;

  const priceValue: [number, number] = [filters.priceMin ?? 0, filters.priceMax ?? 5_000_000];

  /** Get facet count label for a property type, e.g. "Casa (12)" */
  function typeLabel(type: string): string {
    if (!facets) return type;
    const facet = facets.byType.find((f) => f.value === type);
    return facet ? `${type} (${facet.count})` : type;
  }

  /** Build options for the Listing Type dropdown */
  const listingTypeOptions = [
    { value: "Sale", label: t("filters.listingTypeSale") },
    { value: "Lease", label: t("filters.listingTypeLease") },
  ];

  /** Build options for the Property Type dropdown */
  const propertyTypeOptions = PROPERTY_TYPES.map((type) => {
    const facet = facets?.byType.find((f) => f.value === type);
    return {
      value: type,
      label: type,
      count: facet?.count,
    };
  });

  /** Build options for the Beds dropdown */
  const bedroomOptions = BEDROOM_OPTIONS.map((n) => ({
    value: n.toString(),
    label: `${n}+`,
  }));

  /** Build options for the Baths dropdown */
  const bathroomOptions = BATHROOM_OPTIONS.map((n) => ({
    value: n.toString(),
    label: `${n}+`,
  }));

  /** Build options for the Location dropdown */
  const areaOptions = areas.map((area) => ({
    value: area.slug,
    label: area.label,
  }));

  /** The full set of filter controls for the MOBILE sheet.
   * Keeps native selects + inline slider for better mobile UX. */
  const mobileFilterControls = (
    <div className="flex flex-wrap items-center gap-3 w-full">
      {/* Story 3.4: Lifestyle tag chips (AC #1, #2, #3) */}
      <LifestyleTagChips activeTags={filters.tags ?? []} onToggle={toggleTag} />
      {/* Listing Type dropdown (Sale / Lease) */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t("filters.listingType")}
        </label>
        <select
          data-testid="listing-type-filter"
          className="rounded border border-border bg-background px-2 py-1 text-sm"
          value={filters.listingType ?? ""}
          onChange={(e) => setFilter("listingType", e.target.value || undefined)}
        >
          <option value="">{t("filters.listingTypeAll")}</option>
          <option value="Sale">{t("filters.listingTypeSale")}</option>
          <option value="Lease">{t("filters.listingTypeLease")}</option>
        </select>
      </div>

      {/* Type dropdown (AC #1) */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">{t("filters.type")}</label>
        <select
          data-testid="type-filter"
          className="rounded border border-border bg-background px-2 py-1 text-sm"
          value={filters.type ?? ""}
          onChange={(e) => setFilter("type", e.target.value || undefined)}
        >
          <option value="">{t("filters.typeAll")}</option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {typeLabel(type)}
            </option>
          ))}
        </select>
      </div>

      {/* Bedrooms dropdown — hidden for land types (AC #2) */}
      {!isLandType && (
        <div data-testid="bedrooms-filter" className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("filters.bedrooms")}
          </label>
          <select
            className="rounded border border-border bg-background px-2 py-1 text-sm"
            value={filters.bedrooms?.toString() ?? ""}
            onChange={(e) =>
              setFilter("bedrooms", e.target.value ? parseInt(e.target.value, 10) : undefined)
            }
          >
            <option value="">{t("filters.bedroomsAny")}</option>
            {BEDROOM_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Bathrooms dropdown — hidden for land types (AC #2) */}
      {!isLandType && (
        <div data-testid="bathrooms-filter" className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("filters.bathrooms")}
          </label>
          <select
            className="rounded border border-border bg-background px-2 py-1 text-sm"
            value={filters.bathrooms?.toString() ?? ""}
            onChange={(e) =>
              setFilter("bathrooms", e.target.value ? parseInt(e.target.value, 10) : undefined)
            }
          >
            <option value="">{t("filters.bathroomsAny")}</option>
            {BATHROOM_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Price Range slider (AC #4 — 300ms debounce handled by hook) */}
      <div className="flex flex-col gap-1 min-w-[200px]">
        <label className="text-xs font-medium text-muted-foreground">{t("filters.price")}</label>
        <PriceRangeSlider
          value={priceValue}
          onChange={([min, max]) => {
            setFilter("priceMin", min > 0 ? min : undefined);
            setFilter("priceMax", max < 5_000_000 ? max : undefined);
          }}
        />
      </div>

      {/* Location dropdown (AC #7 — flat area slugs for MVP) */}
      {areas.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("filters.location")}
          </label>
          <select
            data-testid="area-filter"
            className="rounded border border-border bg-background px-2 py-1 text-sm"
            value={filters.areaSlug ?? ""}
            onChange={(e) => setFilter("areaSlug", e.target.value || undefined)}
          >
            <option value="">{t("filters.locationAll")}</option>
            {areas.map((area) => (
              <option key={area.slug} value={area.slug}>
                {area.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Filter bar wrapper */}
      <div
        data-testid="search-filter-bar"
        className="sticky top-[var(--header-height)] z-10 py-1 md:py-1.5 bg-background border-b border-border flex flex-col"
      >
        <div className="flex items-stretch px-4 gap-3 h-full">
          {/* Mobile compact bar — visible below md breakpoint */}
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                data-testid="mobile-filters-button"
                className="flex md:hidden items-center gap-2 text-sm font-semibold text-brand-navy"
                aria-label={t("filterBar.label")}
              >
                <SlidersHorizontal size={16} aria-hidden="true" className="text-brand-gold" />
                <span>{t("filterBar.label")}</span>
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-brand-blue text-white text-xs w-5 h-5 font-bold shadow-sm">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-brand-navy font-bold">
                  {t("filterBar.label")}
                </SheetTitle>
              </SheetHeader>
              <div className="py-6 px-1 h-[calc(100vh-80px)] overflow-y-auto no-scrollbar">
                {mobileFilterControls}
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop/tablet filter controls — visible at md: and above */}
          <div className="hidden md:flex flex-col gap-1 w-full">
            {/* Row 1: Lifestyle Tags (compact, scrollable) */}
            <div className="w-full overflow-x-auto no-scrollbar">
              <LifestyleTagChips activeTags={filters.tags ?? []} onToggle={toggleTag} />
            </div>

            {/* Row 2: All controls in a single unified row */}
            <div className="flex items-center gap-2 w-full">
              {/* Left group: View toggle + Filter dropdowns */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* View Mode Toggle (inline) */}
                {onViewModeChange && (
                  <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
                )}

                {/* Divider between view toggle and filters */}
                {onViewModeChange && (
                  <div className="h-6 w-px bg-border/60 shrink-0 hidden lg:block" />
                )}

                {/* Listing Type */}
                <FilterDropdown
                  placeholder={t("filters.listingTypeAll")}
                  value={filters.listingType ?? undefined}
                  options={listingTypeOptions}
                  onChange={(val) => setFilter("listingType", val)}
                  testId="listing-type-filter"
                />

                {/* Property Type */}
                <FilterDropdown
                  placeholder={t("filters.typeAll")}
                  value={filters.type ?? undefined}
                  options={propertyTypeOptions}
                  onChange={(val) => setFilter("type", val)}
                  testId="type-filter"
                />

                {/* Beds — hidden for land types */}
                {!isLandType && (
                  <FilterDropdown
                    placeholder={t("filters.bedrooms")}
                    value={filters.bedrooms?.toString() ?? undefined}
                    options={bedroomOptions}
                    onChange={(val) => setFilter("bedrooms", val ? parseInt(val, 10) : undefined)}
                    testId="bedrooms-filter"
                    formatSelected={(opt) => `${opt.label} ${t("filters.bedrooms")}`}
                  />
                )}

                {/* Baths — hidden for land types */}
                {!isLandType && (
                  <FilterDropdown
                    placeholder={t("filters.bathrooms")}
                    value={filters.bathrooms?.toString() ?? undefined}
                    options={bathroomOptions}
                    onChange={(val) => setFilter("bathrooms", val ? parseInt(val, 10) : undefined)}
                    testId="bathrooms-filter"
                    formatSelected={(opt) => `${opt.label} ${t("filters.bathrooms")}`}
                  />
                )}

                {/* Price Range Popover */}
                <PriceFilterPopover
                  placeholder={t("filters.price")}
                  value={priceValue}
                  onChange={([min, max]) => {
                    setFilter("priceMin", min > 0 ? min : undefined);
                    setFilter("priceMax", max < 5_000_000 ? max : undefined);
                  }}
                />

                {/* Location */}
                {areas.length > 0 && (
                  <FilterDropdown
                    placeholder={t("filters.location")}
                    value={filters.areaSlug ?? undefined}
                    options={areaOptions}
                    onChange={(val) => setFilter("areaSlug", val)}
                    testId="area-filter"
                  />
                )}
              </div>

              {/* Right group: Result count + Sort + Near Me + Unit toggle */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Result count */}
                {resultCount !== undefined && (
                  <span className="text-xs text-muted-foreground font-medium whitespace-nowrap hidden xl:inline">
                    {resultCount.toLocaleString()} {resultCount === 1 ? "result" : "results"}
                  </span>
                )}

                {/* Divider */}
                <div className="h-6 w-px bg-border/60 shrink-0 hidden lg:block" />

                <SortSelect />

                {onNearMeSuccess && onNearMeFallback && (
                  <NearMeButton
                    onLocationSuccess={onNearMeSuccess}
                    onLocationFallback={onNearMeFallback}
                  />
                )}

                <UnitToggle locale={locale} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active filter chips row — shown below filter bar when filters are active */}
      {activeFilterCount > 0 && (
        <FilterChips filters={filters} onClearFilter={clearFilter} onClearAll={clearAll} />
      )}
    </>
  );
}
