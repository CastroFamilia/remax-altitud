"use client";

/**
 * Story 3.3: Search Filters & URL State
 * Component: FilterChips — active filter chips row with dismiss and clear all.
 *
 * ATDD STUB — This file satisfies module resolution for red-phase test scaffolds.
 * Task 6 of Story 3.3 will replace this stub with the full implementation.
 *
 * Architecture: src/components/search/filter-chips.tsx (§3 directory listing)
 * Design token: bg-brand-blue text-white for chips (--brand-blue: #0043FF)
 */

import type { SearchFilters } from "@/types/search";

interface FilterChipsProps {
  filters: SearchFilters;
  onClearFilter: (key: keyof SearchFilters) => void;
  onClearAll: () => void;
}

/**
 * ATDD STUB — Not yet implemented. Story 3.3 Task 6 will implement this.
 *
 * Implementation requirements:
 * - One chip per active filter (excludes 'view' and 'sort')
 * - Chip format: "Type: Casa ×", "Price: $100K–$500K ×"
 * - "Clear all" appears when activeFilterCount >= 2
 * - data-testid="filter-chips" on container
 * - data-testid="clear-all-filters" on "Clear all" button
 * - data-testid="filter-chip" on each chip
 * - data-testid="chip-dismiss" on each × button
 * - bg-brand-blue text-white on chips (Tailwind v4 design token)
 */
export function FilterChips(_props: FilterChipsProps) {
  throw new Error("FilterChips: not yet implemented — Story 3.3 Task 6");
}
