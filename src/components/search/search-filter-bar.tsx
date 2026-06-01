"use client";

/**
 * Story 3.3: Search Filters & URL State
 * Component: SearchFilterBar — real filter controls replacing the Story 3.1 stub.
 *
 * Preserved from Story 3.1 (must NOT break):
 * - data-testid="search-filter-bar" on root div
 * - className: sticky, top-[var(--header-height)], z-10, py-2, md:py-3
 * - className: bg-background, border-b, border-border
 * - data-testid="mobile-filters-button" on mobile button
 * - File starts with 'use client'
 *
 * Story 3.3 additions:
 * - Real filter controls (Type, Price, Beds, Baths, Lot, Location, Sort)
 * - Context-sensitive: land types hide bedrooms/bathrooms (AC #2)
 * - Active filter chips row via FilterChips component (AC #5)
 * - Mobile filter Sheet (Radix Dialog) with full filter set
 */

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchFilters } from "@/hooks/use-search-filters";
import { FilterChips } from "@/components/search/filter-chips";
import { LifestyleTagChips } from "@/components/search/lifestyle-tag-chips";
import { PriceRangeSlider } from "@/components/search/price-range-slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { FilterFacets } from "@/types/search";

/** Property types that are land/lot — hides bedrooms and bathrooms (AC #2) */
const LAND_TYPES = ["Lote", "Terreno", "Finca"];

const PROPERTY_TYPES = ["Casa", "Apartamento", "Lote", "Terreno", "Comercial", "Finca"];

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5];
const BATHROOM_OPTIONS = [1, 2, 3, 4];

interface SearchFilterBarProps {
  facets?: FilterFacets;
  areas?: { slug: string; label: string }[];
}

export function SearchFilterBar({ facets, areas = [] }: SearchFilterBarProps) {
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

  /** The full set of filter controls (used in both desktop bar and mobile sheet).
   * Defined as a variable (not a nested component) to avoid React re-mounting
   * it on every render — nested function components lose state every render. */
  const filterControls = (
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

      {/* Sort dropdown moved to SplitViewLayout toolbar (sort-select.tsx) */}
    </div>
  );

  return (
    <>
      {/* Filter bar wrapper */}
      <div
        data-testid="search-filter-bar"
        className="sticky top-[var(--header-height)] z-10 py-2 md:py-3 bg-background border-b border-border flex flex-col"
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
                {filterControls}
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop/tablet filter controls — visible at md: and above */}
          <div className="hidden md:flex flex-col gap-4 w-full">
            {/* Row 1: Lifestyle Tags (Scrollable, full-width, clean bottom border) */}
            <div className="w-full pb-2.5 border-b border-border/40 overflow-x-auto no-scrollbar">
              <LifestyleTagChips activeTags={filters.tags ?? []} onToggle={toggleTag} />
            </div>

            {/* Row 2: Structured inputs, perfectly balanced to fill the horizontal space */}
            <div className="flex flex-wrap lg:flex-nowrap items-end gap-5 w-full">
              {/* Listing Type dropdown */}
              <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                <label className="text-xs font-semibold text-brand-navy/80">
                  {t("filters.listingType")}
                </label>
                <select
                  data-testid="listing-type-filter"
                  className="rounded-lg border border-brand-gold/30 bg-background px-3 py-2.5 text-sm text-brand-navy font-medium shadow-sm hover:border-brand-gold/60 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none transition-all duration-200 cursor-pointer w-full"
                  value={filters.listingType ?? ""}
                  onChange={(e) => setFilter("listingType", e.target.value || undefined)}
                >
                  <option value="">{t("filters.listingTypeAll")}</option>
                  <option value="Sale">{t("filters.listingTypeSale")}</option>
                  <option value="Lease">{t("filters.listingTypeLease")}</option>
                </select>
              </div>

              {/* Type dropdown */}
              <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                <label className="text-xs font-semibold text-brand-navy/80">
                  {t("filters.type")}
                </label>
                <select
                  data-testid="type-filter"
                  className="rounded-lg border border-brand-gold/30 bg-background px-3 py-2.5 text-sm text-brand-navy font-medium shadow-sm hover:border-brand-gold/60 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none transition-all duration-200 cursor-pointer w-full"
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

              {/* Bedrooms dropdown — hidden for land types */}
              {!isLandType && (
                <div
                  data-testid="bedrooms-filter"
                  className="flex flex-col gap-1.5 flex-1 min-w-[120px]"
                >
                  <label className="text-xs font-semibold text-brand-navy/80">
                    {t("filters.bedrooms")}
                  </label>
                  <select
                    className="rounded-lg border border-brand-gold/30 bg-background px-3 py-2.5 text-sm text-brand-navy font-medium shadow-sm hover:border-brand-gold/60 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none transition-all duration-200 cursor-pointer w-full"
                    value={filters.bedrooms?.toString() ?? ""}
                    onChange={(e) =>
                      setFilter(
                        "bedrooms",
                        e.target.value ? parseInt(e.target.value, 10) : undefined,
                      )
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

              {/* Bathrooms dropdown — hidden for land types */}
              {!isLandType && (
                <div
                  data-testid="bathrooms-filter"
                  className="flex flex-col gap-1.5 flex-1 min-w-[120px]"
                >
                  <label className="text-xs font-semibold text-brand-navy/80">
                    {t("filters.bathrooms")}
                  </label>
                  <select
                    className="rounded-lg border border-brand-gold/30 bg-background px-3 py-2.5 text-sm text-brand-navy font-medium shadow-sm hover:border-brand-gold/60 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none transition-all duration-200 cursor-pointer w-full"
                    value={filters.bathrooms?.toString() ?? ""}
                    onChange={(e) =>
                      setFilter(
                        "bathrooms",
                        e.target.value ? parseInt(e.target.value, 10) : undefined,
                      )
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

              {/* Price Range slider (flex-[2] to give it proportional prominence) */}
              <div className="flex flex-col gap-1.5 flex-[2] min-w-[280px]">
                <label className="text-xs font-semibold text-brand-navy/80">
                  {t("filters.price")}
                </label>
                <div className="bg-background border border-brand-gold/20 rounded-lg px-4 py-2.5 shadow-sm hover:border-brand-gold/40 transition-colors w-full">
                  <PriceRangeSlider
                    value={priceValue}
                    onChange={([min, max]) => {
                      setFilter("priceMin", min > 0 ? min : undefined);
                      setFilter("priceMax", max < 5_000_000 ? max : undefined);
                    }}
                  />
                </div>
              </div>

              {/* Location dropdown */}
              {areas.length > 0 && (
                <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
                  <label className="text-xs font-semibold text-brand-navy/80">
                    {t("filters.location")}
                  </label>
                  <select
                    data-testid="area-filter"
                    className="rounded-lg border border-brand-gold/30 bg-background px-3 py-2.5 text-sm text-brand-navy font-medium shadow-sm hover:border-brand-gold/60 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none transition-all duration-200 cursor-pointer w-full"
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
