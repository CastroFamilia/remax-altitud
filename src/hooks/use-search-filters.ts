"use client";

/**
 * Story 3.3: Search Filters & URL State
 * Hook: useSearchFilters — reads and writes search filter URL state.
 *
 * Architecture mandate (AR10): Filter values MUST live in URL query params.
 * This hook is the single source of truth for reading/writing filter URL state.
 *
 * - Uses useSearchParams() from next/navigation to read current filter values
 * - Uses useRouter().replace() with { scroll: false } to update URL without reload
 * - Debounce numeric inputs (priceMin/Max, lotSize) at 300ms
 * - activeFilterCount excludes 'view' and 'sort'
 * - clearAll removes all filter params except 'view'
 */

import { useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { SearchFilters, SortOption } from "@/types/search";

export interface UseSearchFiltersReturn {
  filters: SearchFilters;
  setFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K] | undefined) => void;
  clearFilter: (key: keyof SearchFilters) => void;
  clearAll: () => void;
  activeFilterCount: number; // count excluding 'view' and 'sort'
}

/** URL param names — short, human-readable, lowercase (UX spec §9 SEO) */
const PARAM_MAP: Record<keyof SearchFilters, string> = {
  type: "type",
  priceMin: "price_min",
  priceMax: "price_max",
  bedrooms: "bedrooms",
  bathrooms: "bathrooms",
  lotSizeMin: "lot_min",
  lotSizeMax: "lot_max",
  areaSlug: "area",
  sort: "sort",
  view: "view",
};

/** Filter keys that count toward activeFilterCount (exclude view and sort) */
const FILTER_KEYS: Array<keyof SearchFilters> = [
  "type",
  "priceMin",
  "priceMax",
  "bedrooms",
  "bathrooms",
  "lotSizeMin",
  "lotSizeMax",
  "areaSlug",
];

/** Valid sort options */
const VALID_SORT_OPTIONS: SortOption[] = ["newest", "price_asc", "price_desc", "relevance"];

/** Numeric debounce keys — these use 300ms debounce (price slider, lot size) */
const DEBOUNCED_KEYS: Array<keyof SearchFilters> = [
  "priceMin",
  "priceMax",
  "lotSizeMin",
  "lotSizeMax",
];

/** Parse SearchFilters from current URLSearchParams */
function parseFilters(params: URLSearchParams): SearchFilters {
  const filters: SearchFilters = {};

  const type = params.get("type");
  if (type) filters.type = type;

  const priceMin = parseInt(params.get("price_min") ?? "", 10);
  if (Number.isFinite(priceMin) && priceMin >= 0) filters.priceMin = priceMin;

  const priceMax = parseInt(params.get("price_max") ?? "", 10);
  if (Number.isFinite(priceMax) && priceMax >= 0) filters.priceMax = priceMax;

  const bedrooms = parseInt(params.get("bedrooms") ?? "", 10);
  if (Number.isFinite(bedrooms) && bedrooms >= 0) filters.bedrooms = bedrooms;

  const bathrooms = parseInt(params.get("bathrooms") ?? "", 10);
  if (Number.isFinite(bathrooms) && bathrooms >= 0) filters.bathrooms = bathrooms;

  const lotSizeMin = parseFloat(params.get("lot_min") ?? "");
  if (Number.isFinite(lotSizeMin) && lotSizeMin >= 0) filters.lotSizeMin = lotSizeMin;

  const lotSizeMax = parseFloat(params.get("lot_max") ?? "");
  if (Number.isFinite(lotSizeMax) && lotSizeMax >= 0) filters.lotSizeMax = lotSizeMax;

  const areaSlug = params.get("area");
  if (areaSlug) filters.areaSlug = areaSlug;

  const sort = params.get("sort");
  if (sort && VALID_SORT_OPTIONS.includes(sort as SortOption)) {
    filters.sort = sort as SortOption;
  }

  const view = params.get("view");
  if (view === "split" || view === "map" || view === "grid") {
    filters.view = view;
  }

  return filters;
}

/** Serialize a single filter value to its URL string representation */
function serializeValue(
  key: keyof SearchFilters,
  value: SearchFilters[keyof SearchFilters],
): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

export function useSearchFilters(): UseSearchFiltersReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Debounce timers per key
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Memoize the filters object so its reference is stable across renders unless
  // the underlying URL search params actually change. Without this, every
  // consumer that depends on `filters` (e.g. effects in SearchPageClient) would
  // re-run on every render, causing an infinite refetch loop.
  // We key off the serialized string because Next.js does not guarantee
  // identity stability of ReadonlyURLSearchParams across renders.
  const searchParamsString = searchParams.toString();
  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParamsString)),
    [searchParamsString],
  );

  const activeFilterCount = useMemo(
    () =>
      FILTER_KEYS.filter((key) => {
        const value = filters[key];
        return value !== undefined && value !== null;
      }).length,
    [filters],
  );

  /** Write updated URLSearchParams to router without scrolling */
  const commitParams = useCallback(
    (newParams: URLSearchParams) => {
      const url = `${pathname}?${newParams.toString()}`;
      router.replace(url, { scroll: false });
    },
    [pathname, router],
  );

  // Track the most recent committed params in a ref so debounced timers can
  // compose against the latest URL state — not the snapshot they captured at
  // schedule time. This prevents the "set min then max within 300ms" race
  // where the second commit would overwrite the first.
  const latestParamsRef = useRef<URLSearchParams>(new URLSearchParams(searchParams.toString()));
  latestParamsRef.current = new URLSearchParams(searchParams.toString());

  const setFilter = useCallback(
    <K extends keyof SearchFilters>(key: K, value: SearchFilters[K] | undefined) => {
      const paramKey = PARAM_MAP[key];

      const performUpdate = () => {
        // Compose against the latest known params (instant updates use the
        // current snapshot; debounced updates use whatever has been committed
        // since they were scheduled).
        const newParams = new URLSearchParams(latestParamsRef.current.toString());
        if (value === undefined || value === null) {
          newParams.delete(paramKey);
        } else {
          newParams.set(paramKey, serializeValue(key, value));
        }
        latestParamsRef.current = newParams;
        commitParams(newParams);
      };

      if (DEBOUNCED_KEYS.includes(key)) {
        // Debounce numeric inputs at 300ms
        clearTimeout(debounceTimers.current[key as string]);
        debounceTimers.current[key as string] = setTimeout(performUpdate, 300);
      } else {
        // Instant update for dropdowns and non-numeric filters
        performUpdate();
      }
    },
    [commitParams],
  );

  const clearFilter = useCallback(
    (key: keyof SearchFilters) => {
      const paramKey = PARAM_MAP[key];
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete(paramKey);
      commitParams(newParams);
    },
    [searchParams, commitParams],
  );

  const clearAll = useCallback(() => {
    // Remove all filter params but preserve 'view' (it's not a filter — AR10)
    const newParams = new URLSearchParams();
    const view = searchParams.get("view");
    if (view) newParams.set("view", view);
    commitParams(newParams);
  }, [searchParams, commitParams]);

  return {
    filters,
    setFilter,
    clearFilter,
    clearAll,
    activeFilterCount,
  };
}
