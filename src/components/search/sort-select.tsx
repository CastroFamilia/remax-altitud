"use client";

/**
 * Sort dropdown extracted from SearchFilterBar so it can be placed
 * in the desktop toolbar (SplitViewLayout) next to the Near-Me button,
 * saving a full row of vertical space.
 *
 * It uses the same useSearchFilters hook, so the URL state stays in sync.
 */

import { useTranslations } from "next-intl";
import { useSearchFilters } from "@/hooks/use-search-filters";

export function SortSelect() {
  const t = useTranslations("SearchPage");
  const { filters, setFilter } = useSearchFilters();

  return (
    <div className="flex items-center gap-1.5">
      <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
        {t("filters.sort")}
      </label>
      <select
        data-testid="sort-select"
        className="rounded border border-border bg-background px-2 py-1.5 text-sm"
        value={filters.sort ?? ""}
        onChange={(e) =>
          setFilter(
            "sort",
            (e.target.value as "newest" | "price_asc" | "price_desc" | "relevance") || undefined,
          )
        }
      >
        <option value="">{t("filters.sortNewest")}</option>
        <option value="price_asc">{t("filters.sortPriceAsc")}</option>
        <option value="price_desc">{t("filters.sortPriceDesc")}</option>
        <option value="relevance">{t("filters.sortRelevance")}</option>
      </select>
    </div>
  );
}
