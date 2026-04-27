"use client";

/**
 * Story 3.3: Search Filters & URL State
 * Hook: useSearchFilters — reads and writes search filter URL state.
 *
 * ATDD STUB — This file satisfies module resolution for red-phase test scaffolds.
 * Task 2 of Story 3.3 will replace this stub with the full implementation.
 *
 * Architecture mandate (AR10): Filter values MUST live in URL query params.
 * This hook is the single source of truth for reading/writing filter URL state.
 */

import type { SearchFilters } from "@/types/search";

export interface UseSearchFiltersReturn {
  filters: SearchFilters;
  setFilter: <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K] | undefined,
  ) => void;
  clearFilter: (key: keyof SearchFilters) => void;
  clearAll: () => void;
  activeFilterCount: number;
}

/**
 * ATDD STUB — Not yet implemented. Story 3.3 Task 2 will implement this hook.
 *
 * Implementation requirements:
 * - Use useSearchParams() from next/navigation to read filter values
 * - Use useRouter().replace() with { scroll: false } to update URL
 * - Debounce numeric inputs (priceMin/Max, lotSize) at 300ms
 * - activeFilterCount excludes 'view' and 'sort'
 * - clearAll removes all filter params except 'view'
 */
export function useSearchFilters(): UseSearchFiltersReturn {
  throw new Error("useSearchFilters: not yet implemented — Story 3.3 Task 2");
}
