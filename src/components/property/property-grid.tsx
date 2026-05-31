"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SearchResultsSkeleton } from "@/components/search/search-results-skeleton";
import { PropertyCard } from "@/components/property/property-card";
import { NoResultsState } from "@/components/property/no-results-state";
import type { PropertySearchItem, SearchFilters } from "@/types/search";
import type { UnitSystem } from "@/lib/utils/units";

const ITEMS_PER_PAGE = 20;

interface PropertyGridProps {
  properties: PropertySearchItem[];
  locale: string;
  isLoading?: boolean;
  total?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  unitSystem?: UnitSystem;
  /** Story 3.8: Active search filters to forward to NoResultsState */
  filters?: SearchFilters;
  className?: string;
}

export function PropertyGrid({
  properties,
  locale,
  isLoading = false,
  total,
  page = 1,
  onPageChange,
  unitSystem,
  filters,
  className,
}: PropertyGridProps) {
  const tGrid = useTranslations("SearchPage.grid");

  if (isLoading) {
    return <SearchResultsSkeleton className={className} />;
  }

  const totalCount = total ?? properties.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const showPagination = totalCount > ITEMS_PER_PAGE;

  // Compute current page slice
  const startIdx = (page - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const currentPageItems = properties.slice(startIdx, endIdx);

  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  return (
    <div
      data-testid="property-grid"
      className={cn(
        "grid gap-4 p-4 lg:gap-6",
        className || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {currentPageItems.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          locale={locale}
          unitSystem={unitSystem}
        />
      ))}

      {/* Empty state — Story 3.8: render NoResultsState with active filters */}
      {currentPageItems.length === 0 && !isLoading && (
        <div className="col-span-full">
          <NoResultsState filters={filters ?? {}} />
        </div>
      )}

      {/* Pagination — spans full width */}
      {showPagination && (
        <div className="col-span-full flex items-center justify-center gap-4 py-4">
          <button
            type="button"
            data-testid="pagination-prev"
            disabled={isFirstPage}
            aria-disabled={isFirstPage}
            onClick={() => !isFirstPage && onPageChange?.(page - 1)}
            className="rounded px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:bg-muted"
          >
            {tGrid("prev")}
          </button>

          <span className="text-sm text-muted-foreground">
            {tGrid("page", { page, total: totalPages })}
          </span>

          <button
            type="button"
            data-testid="pagination-next"
            disabled={isLastPage}
            aria-disabled={isLastPage}
            onClick={() => !isLastPage && onPageChange?.(page + 1)}
            className="rounded px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:bg-muted"
          >
            {tGrid("next")}
          </button>
        </div>
      )}
    </div>
  );
}
