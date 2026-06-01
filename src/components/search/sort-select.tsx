"use client";

/**
 * Sort dropdown — styled consistently with FilterDropdown popovers.
 * Uses the same useSearchFilters hook so URL state stays in sync.
 */

import { useTranslations } from "next-intl";
import { useSearchFilters } from "@/hooks/use-search-filters";
import { FilterDropdown } from "@/components/search/filter-dropdown";

const SORT_OPTIONS = [
  { value: "newest", labelKey: "filters.sortNewest" },
  { value: "price_asc", labelKey: "filters.sortPriceAsc" },
  { value: "price_desc", labelKey: "filters.sortPriceDesc" },
  { value: "relevance", labelKey: "filters.sortRelevance" },
] as const;

export function SortSelect() {
  const t = useTranslations("SearchPage");
  const { filters, setFilter } = useSearchFilters();

  const options = SORT_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(opt.labelKey),
  }));

  return (
    <FilterDropdown
      placeholder={t("filters.sort")}
      value={filters.sort ?? undefined}
      options={options}
      onChange={(val) =>
        setFilter("sort", (val as "newest" | "price_asc" | "price_desc" | "relevance") || undefined)
      }
      testId="sort-select"
    />
  );
}
