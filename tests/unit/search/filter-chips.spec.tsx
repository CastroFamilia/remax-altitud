/**
 * Story 3.3: Search Filters & URL State
 * Component: src/components/search/filter-chips.tsx
 *
 * TDD RED PHASE — all tests use it.skip() and will FAIL until
 * filter-chips.tsx is implemented.
 *
 * Covers:
 *   AC #5 — Active filters shown as dismissible chips; "Clear all" when 2+ active
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via vitest.config.mts)
 *
 * Component interface:
 *   interface FilterChipsProps {
 *     filters: SearchFilters;
 *     onClearFilter: (key: keyof SearchFilters) => void;
 *     onClearAll: () => void;
 *   }
 *
 * Rendering rules:
 *   - One chip per active filter (excludes 'view' and 'sort')
 *   - Chip format: "Type: Casa ×", "Price: $100K–$500K ×", "Beds: 3+ ×"
 *   - "Clear all" appears when activeFilterCount >= 2
 *   - data-testid="filter-chips" on container
 *   - data-testid="clear-all-filters" on "Clear all" button
 */

import { describe, expect, it, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ replace: vi.fn() })),
  useSearchParams: vi.fn(() => ({
    toString: vi.fn(() => ""),
    get: vi.fn(() => null),
  })),
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string, values?: Record<string, unknown>) => {
    // Minimal translation stub for filter chip labels
    const map: Record<string, string> = {
      "filters.type": "Type",
      "filters.price": "Price",
      "filters.bedrooms": "Beds",
      "filters.bathrooms": "Baths",
      "filters.lotSize": "Lot Size",
      "filters.location": "Location",
      "filters.clearAll": "Clear all",
      "filters.dismiss": "Remove filter",
    };
    if (values && "label" in values && "value" in values) {
      return `${String(values.label)}: ${String(values.value)} ×`;
    }
    return map[key] ?? key;
  }),
}));

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks
// ---------------------------------------------------------------------------

import { FilterChips } from "@/components/search/filter-chips"; // imported AFTER mocks
import type { SearchFilters } from "@/types/search"; // imported AFTER mocks

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const noop = vi.fn();

function renderChips(filters: SearchFilters, onClearFilter = noop, onClearAll = noop) {
  return render(
    <FilterChips filters={filters} onClearFilter={onClearFilter} onClearAll={onClearAll} />,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FilterChips — active filter chips row (AC #5)", () => {
  // -------------------------------------------------------------------------
  // data-testid presence
  // -------------------------------------------------------------------------

  it.skip(
    "[P0] renders data-testid='filter-chips' container element",
    () => {
      // THIS TEST WILL FAIL — filter-chips.tsx not yet implemented
      renderChips({ type: "Casa" });

      const container = document.querySelector('[data-testid="filter-chips"]');
      expect(container).not.toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // AC #5: One chip per active filter
  // -------------------------------------------------------------------------

  it.skip(
    "[P0] renders one chip for each active filter (excludes view and sort)",
    () => {
      // THIS TEST WILL FAIL — filter-chips.tsx not yet implemented
      const filters: SearchFilters = {
        type: "Casa",
        bedrooms: 3,
        view: "split",   // must NOT produce a chip
        sort: "newest",  // must NOT produce a chip
      };
      renderChips(filters);

      // Two active filter chips: type + bedrooms
      const chips = document.querySelectorAll('[data-testid="filter-chip"]');
      expect(chips).toHaveLength(2);
    },
  );

  it.skip(
    "[P0] renders type chip with label 'Type: Casa ×' (or equivalent translated form)",
    () => {
      // THIS TEST WILL FAIL — filter-chips.tsx not yet implemented
      renderChips({ type: "Casa" });

      const chipsContainer = document.querySelector('[data-testid="filter-chips"]');
      expect(chipsContainer?.textContent).toMatch(/Casa/);
    },
  );

  it.skip(
    "[P0] renders bedrooms chip with minimum beds count display",
    () => {
      // THIS TEST WILL FAIL — filter-chips.tsx not yet implemented
      renderChips({ bedrooms: 3 });

      const chipsContainer = document.querySelector('[data-testid="filter-chips"]');
      expect(chipsContainer?.textContent).toMatch(/3/);
    },
  );

  it.skip(
    "[P0] renders price chip when priceMin is set",
    () => {
      // THIS TEST WILL FAIL — filter-chips.tsx not yet implemented
      renderChips({ priceMin: 100_000, priceMax: 500_000 });

      const chipsContainer = document.querySelector('[data-testid="filter-chips"]');
      // Price chip should show abbreviated values
      expect(chipsContainer?.textContent).toMatch(/\$100K|\$500K|\$.*–/);
    },
  );

  // -------------------------------------------------------------------------
  // AC #5: Dismiss chip via × button
  // -------------------------------------------------------------------------

  it.skip(
    "[P0] clicking the × button on a chip calls onClearFilter with the correct key",
    () => {
      // THIS TEST WILL FAIL — filter-chips.tsx not yet implemented
      const onClearFilter = vi.fn();
      renderChips({ type: "Casa", bedrooms: 2 }, onClearFilter);

      // Find the dismiss button for the type chip (× button)
      const dismissButtons = document.querySelectorAll('[data-testid="chip-dismiss"]');
      expect(dismissButtons.length).toBeGreaterThan(0);

      // Click the first dismiss button (type chip)
      fireEvent.click(dismissButtons[0]);

      // onClearFilter should be called with 'type' key
      expect(onClearFilter).toHaveBeenCalledWith("type");
    },
  );

  // -------------------------------------------------------------------------
  // AC #5: "Clear all" appears only when 2+ active filters
  // -------------------------------------------------------------------------

  it.skip(
    "[P0] 'Clear all' button is NOT rendered when only 1 filter is active",
    () => {
      // THIS TEST WILL FAIL — filter-chips.tsx not yet implemented
      renderChips({ type: "Casa" });

      const clearAll = document.querySelector('[data-testid="clear-all-filters"]');
      expect(clearAll).toBeNull();
    },
  );

  it.skip(
    "[P0] 'Clear all' button IS rendered when 2 or more filters are active",
    () => {
      // THIS TEST WILL FAIL — filter-chips.tsx not yet implemented
      renderChips({ type: "Casa", bedrooms: 3 });

      const clearAll = document.querySelector('[data-testid="clear-all-filters"]');
      expect(clearAll).not.toBeNull();
    },
  );

  it.skip(
    "[P0] clicking 'Clear all' calls onClearAll callback",
    () => {
      // THIS TEST WILL FAIL — filter-chips.tsx not yet implemented
      const onClearAll = vi.fn();
      renderChips({ type: "Casa", bedrooms: 3 }, noop, onClearAll);

      const clearAll = document.querySelector('[data-testid="clear-all-filters"]');
      expect(clearAll).not.toBeNull();
      fireEvent.click(clearAll!);

      expect(onClearAll).toHaveBeenCalledOnce();
    },
  );

  // -------------------------------------------------------------------------
  // Edge case: no active filters — container renders empty or hidden
  // -------------------------------------------------------------------------

  it.skip(
    "[P1] renders nothing or empty container when no active filters are set",
    () => {
      // THIS TEST WILL FAIL — filter-chips.tsx not yet implemented
      renderChips({}); // no filters

      const chips = document.querySelectorAll('[data-testid="filter-chip"]');
      expect(chips).toHaveLength(0);

      const clearAll = document.querySelector('[data-testid="clear-all-filters"]');
      expect(clearAll).toBeNull();
    },
  );

  it.skip(
    "[P1] view and sort params do NOT generate chips",
    () => {
      // THIS TEST WILL FAIL — filter-chips.tsx not yet implemented
      renderChips({ view: "grid", sort: "price_desc" });

      const chips = document.querySelectorAll('[data-testid="filter-chip"]');
      expect(chips).toHaveLength(0);
    },
  );

  // -------------------------------------------------------------------------
  // Architecture compliance
  // -------------------------------------------------------------------------

  it.skip(
    "[P1] FilterChips is a Client Component (file must start with 'use client')",
    async () => {
      // THIS TEST WILL FAIL — filter-chips.tsx not yet implemented
      const fs = await import("node:fs");
      const path = await import("node:path");

      const filePath = path.resolve(
        process.cwd(),
        "src/components/search/filter-chips.tsx",
      );
      expect(fs.existsSync(filePath)).toBe(true);

      const src = fs.readFileSync(filePath, "utf8");
      expect(src.trimStart()).toMatch(/^['"]use client['"]/);
    },
  );
});
