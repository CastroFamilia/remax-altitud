"use client";

import { useTranslations } from "next-intl";
import { SearchResultsSkeleton } from "@/components/search/search-results-skeleton";
import { PropertyCard } from "@/components/property/property-card";
import type { PropertySearchItem } from "@/types/search";

const ITEMS_PER_PAGE = 20;

interface PropertyGridProps {
  properties: PropertySearchItem[];
  locale: string;
  isLoading?: boolean;
  total?: number;
  page?: number;
  onPageChange?: (page: number) => void;
}

export function PropertyGrid({
  properties,
  locale,
  isLoading = false,
  total,
  page = 1,
  onPageChange,
}: PropertyGridProps) {
  const tGrid = useTranslations("SearchPage.grid");

  if (isLoading) {
    return <SearchResultsSkeleton />;
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
      className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
    >
      {currentPageItems.map((property) => (
        <PropertyCard key={property.id} property={property} locale={locale} />
      ))}

      {/* Empty state */}
      {currentPageItems.length === 0 && (
        <div className="col-span-full py-12 text-center text-muted-foreground">
          {tGrid("empty")}
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
