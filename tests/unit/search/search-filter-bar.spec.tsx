/**
 * Story 3.1: Search Page Layout & Split-View
 * Component: src/components/search/search-filter-bar.tsx
 *
 * Covers:
 *   AC #6 (Story 3.1) — Sticky filter bar remains fixed at the top of the grid
 *                        panel when the user scrolls the results grid.
 *   AC #1 (Story 3.3) — Filter bar shows Type, Price Range, Bedrooms, Bathrooms,
 *                        Lot Size, Location controls.
 *   AC #2 (Story 3.3) — Bedrooms and bathrooms hidden when a land-type is selected.
 *   AC #5 (Story 3.3) — Active filter chips row with × dismiss and "Clear all".
 *
 * PRESERVED from Story 3.1 (must NOT break):
 *   - data-testid="search-filter-bar" on root div
 *   - className contains: sticky, top-[var(--header-height)], z-10, h-12, h-14
 *   - className contains: bg-background, border-b, border-border
 *   - data-testid="mobile-filters-button" on mobile button
 *   - File starts with 'use client'
 *
 * UPDATED in Story 3.3:
 *   - Removed: animate-pulse placeholder test (stub replaced by real filter controls)
 *   - Added: Type dropdown renders; land type hides bedrooms/bathrooms; chips tests
 */

import { describe, expect, it, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { readFileSync } from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Module mocks
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
    const map: Record<string, string> = {
      label: "Filters",
      loading: "Filter bar loading",
      "filters.type": "Type",
      "filters.typeAll": "All Types",
      "filters.price": "Price",
      "filters.bedrooms": "Beds",
      "filters.bathrooms": "Baths",
      "filters.lotSize": "Lot Size",
      "filters.location": "Location",
      "filters.sort": "Sort",
      "filters.clearAll": "Clear all",
    };
    if (values && "label" in values && "value" in values) {
      return `${String(values.label)}: ${String(values.value)}`;
    }
    return map[key] ?? key;
  }),
}));

// Mock useSearchFilters hook used by the real filter bar implementation
vi.mock("@/hooks/use-search-filters", () => ({
  useSearchFilters: vi.fn(() => ({
    filters: {},
    setFilter: vi.fn(),
    clearFilter: vi.fn(),
    clearAll: vi.fn(),
    activeFilterCount: 0,
  })),
}));

// Mock Sheet (Radix Dialog) to avoid ResizeObserver dependency in jsdom
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children?: React.ReactNode; asChild?: boolean }) => <div>{children}</div>,
  SheetContent: ({ children }: { children?: React.ReactNode }) => <div data-testid="sheet-content">{children}</div>,
  SheetHeader: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

// Mock PriceRangeSlider to avoid @radix-ui/react-slider ResizeObserver dependency
vi.mock("@/components/search/price-range-slider", () => ({
  PriceRangeSlider: ({ value }: { value: [number, number]; onChange: (v: [number, number]) => void }) => (
    <div data-testid="price-range-slider">{value[0]} – {value[1]}</div>
  ),
}));

// Mock FilterChips to keep search-filter-bar tests focused
vi.mock("@/components/search/filter-chips", () => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  FilterChips: ({ filters, onClearFilter, onClearAll }: { filters: unknown; onClearFilter: unknown; onClearAll: unknown }) => (
    <div data-testid="filter-chips" />
  ),
}));

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks
// ---------------------------------------------------------------------------

import { SearchFilterBar } from "@/components/search/search-filter-bar";
import { useSearchFilters } from "@/hooks/use-search-filters"; // imported AFTER mocks (for vi.mocked)

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SearchFilterBar", () => {
  // -------------------------------------------------------------------------
  // AC #6: Sticky positioning — the container must have position: sticky + top: 0
  // -------------------------------------------------------------------------

  it(
    "[P0] filter bar container has position: sticky pinned below the header (stays fixed during scroll)",
    () => {
      render(<SearchFilterBar />);

      const filterBar = document.querySelector('[data-testid="search-filter-bar"]');

      expect(filterBar).not.toBeNull();

      // sticky + offset are the critical positioning classes (AC #6)
      // Filter bar sits below the global sticky header, so its `top` must
      // equal the header height — not `0` — to avoid stacking on top of it.
      expect(filterBar?.className).toContain("sticky");
      expect(filterBar?.className).toContain("top-[var(--header-height)]");

      // z-index must be above content but below modals (z-10)
      expect(filterBar?.className).toContain("z-10");
    },
  );

  // -------------------------------------------------------------------------
  // AC #6: Height and baseline layout
  // -------------------------------------------------------------------------

  it(
    "[P1] filter bar has h-14 height and correct background/border classes on desktop",
    () => {
      render(<SearchFilterBar />);

      const filterBar = document.querySelector('[data-testid="search-filter-bar"]');

      expect(filterBar).not.toBeNull();
      expect(filterBar?.className).toContain("h-14");
      expect(filterBar?.className).toContain("bg-background");
      expect(filterBar?.className).toContain("border-b");
      expect(filterBar?.className).toContain("border-border");
    },
  );

  // -------------------------------------------------------------------------
  // Story 3.3: Type dropdown control renders (replaces animate-pulse loading stub)
  // NOTE: The loading placeholder (aria-label="Filter bar loading" + animate-pulse)
  // was REMOVED by Story 3.3 — this test now asserts real filter controls exist.
  // -------------------------------------------------------------------------

  it(
    "[P1] renders Type dropdown control on desktop (data-testid='type-filter' — Story 3.3)",
    () => {
      // THIS TEST WILL FAIL — SearchFilterBar real controls not yet implemented
      render(<SearchFilterBar />);

      // The animate-pulse stub is removed; real type dropdown must be present on desktop
      const typeFilter = document.querySelector('[data-testid="type-filter"]');
      expect(typeFilter).not.toBeNull();

      // The old loading placeholder must be GONE (stub is replaced)
      const loadingPlaceholder = document.querySelector('[aria-label="Filter bar loading"]');
      expect(loadingPlaceholder).toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // AC #5 (mobile compact bar)
  // -------------------------------------------------------------------------

  it(
    "[P1] renders compact 'Filters' button with SlidersHorizontal icon on mobile (h-12)",
    () => {
      render(<SearchFilterBar />);

      // Look for the Filters button (accessible name)
      const filtersButton = document.querySelector('[data-testid="mobile-filters-button"]');

      expect(filtersButton).not.toBeNull();
      expect(filtersButton?.tagName.toLowerCase()).toBe("button");

      // The SlidersHorizontal icon SVG should be inside the button
      const icon = filtersButton?.querySelector("svg");
      expect(icon).not.toBeNull();

      // Text content must include "Filters" (or translated equivalent)
      expect(filtersButton?.textContent).toMatch(/filter/i);
    },
  );

  // -------------------------------------------------------------------------
  // Mobile bar height
  // -------------------------------------------------------------------------

  it(
    "[P2] filter bar has h-12 class on mobile viewport",
    () => {
      render(<SearchFilterBar />);

      const filterBar = document.querySelector('[data-testid="search-filter-bar"]');

      expect(filterBar).not.toBeNull();
      // Mobile-first: base class h-12, upgraded at md: breakpoint
      expect(filterBar?.className).toContain("h-12");
    },
  );

  // -------------------------------------------------------------------------
  // Client component marker (static file content check)
  // -------------------------------------------------------------------------

  it(
    "[P2] SearchFilterBar is a Client Component (file must start with 'use client')",
    () => {
      const filePath = path.resolve(
        process.cwd(),
        "src/components/search/search-filter-bar.tsx",
      );
      const src = readFileSync(filePath, "utf8");
      expect(src.trimStart()).toMatch(/^['"]use client['"]/);
    },
  );

  // -------------------------------------------------------------------------
  // Story 3.3: AC #2 — Context-sensitive: land types hide bedrooms & bathrooms
  // -------------------------------------------------------------------------

  it(
    "[P0] hides bedrooms and bathrooms controls when type='Lote' is selected (AC #2 — Story 3.3)",
    () => {
      // Re-mock useSearchFilters to return a land-type filter
      vi.mocked(useSearchFilters).mockReturnValue({
        filters: { type: "Lote" },
        setFilter: vi.fn(),
        clearFilter: vi.fn(),
        clearAll: vi.fn(),
        activeFilterCount: 1,
      });

      render(<SearchFilterBar />);

      // Bedrooms and bathrooms controls must be hidden for land types
      const bedroomsFilter = document.querySelector('[data-testid="bedrooms-filter"]');
      const bathroomsFilter = document.querySelector('[data-testid="bathrooms-filter"]');

      // Either element is null (not rendered) or has a hidden class
      const bedroomsHidden =
        bedroomsFilter === null ||
        (bedroomsFilter as HTMLElement).style.display === "none" ||
        bedroomsFilter.className.includes("hidden");
      const bathroomsHidden =
        bathroomsFilter === null ||
        (bathroomsFilter as HTMLElement).style.display === "none" ||
        bathroomsFilter.className.includes("hidden");

      expect(bedroomsHidden).toBe(true);
      expect(bathroomsHidden).toBe(true);
    },
  );

  it(
    "[P0] hides bedrooms and bathrooms controls when type='Terreno' is selected (AC #2 — Story 3.3)",
    () => {
      vi.mocked(useSearchFilters).mockReturnValue({
        filters: { type: "Terreno" },
        setFilter: vi.fn(),
        clearFilter: vi.fn(),
        clearAll: vi.fn(),
        activeFilterCount: 1,
      });

      render(<SearchFilterBar />);

      const bedroomsFilter = document.querySelector('[data-testid="bedrooms-filter"]');
      const bathroomsFilter = document.querySelector('[data-testid="bathrooms-filter"]');

      const bedroomsHidden =
        bedroomsFilter === null || bedroomsFilter.className.includes("hidden");
      const bathroomsHidden =
        bathroomsFilter === null || bathroomsFilter.className.includes("hidden");

      expect(bedroomsHidden).toBe(true);
      expect(bathroomsHidden).toBe(true);
    },
  );

  it(
    "[P0] shows bedrooms and bathrooms controls when type='Casa' is selected (AC #2 — Story 3.3)",
    () => {
      vi.mocked(useSearchFilters).mockReturnValue({
        filters: { type: "Casa" },
        setFilter: vi.fn(),
        clearFilter: vi.fn(),
        clearAll: vi.fn(),
        activeFilterCount: 1,
      });

      render(<SearchFilterBar />);

      // For non-land types, bedrooms and bathrooms controls must be visible
      const bedroomsFilter = document.querySelector('[data-testid="bedrooms-filter"]');
      const bathroomsFilter = document.querySelector('[data-testid="bathrooms-filter"]');

      expect(bedroomsFilter).not.toBeNull();
      expect(bathroomsFilter).not.toBeNull();

      // Must not have a hidden class
      expect(bedroomsFilter?.className).not.toContain("hidden");
      expect(bathroomsFilter?.className).not.toContain("hidden");
    },
  );

  // -------------------------------------------------------------------------
  // Story 3.3: AC #5 — Active filter chips row
  // -------------------------------------------------------------------------

  it(
    "[P0] renders FilterChips row when at least one filter is active (AC #5 — Story 3.3)",
    () => {
      vi.mocked(useSearchFilters).mockReturnValue({
        filters: { type: "Casa" },
        setFilter: vi.fn(),
        clearFilter: vi.fn(),
        clearAll: vi.fn(),
        activeFilterCount: 1,
      });

      render(<SearchFilterBar />);

      // FilterChips container must be present when filters are active
      const filterChips = document.querySelector('[data-testid="filter-chips"]');
      expect(filterChips).not.toBeNull();
    },
  );

  it(
    "[P1] does NOT render FilterChips row when no filters are active (AC #5 — Story 3.3)",
    () => {
      // Reset to default factory return (activeFilterCount: 0) in case a previous
      // test called mockReturnValue. vi.clearAllMocks() preserves mockReturnValue.
      vi.mocked(useSearchFilters).mockReturnValue({
        filters: {},
        setFilter: vi.fn(),
        clearFilter: vi.fn(),
        clearAll: vi.fn(),
        activeFilterCount: 0,
      });
      render(<SearchFilterBar />); // useSearchFilters returns activeFilterCount: 0

      // FilterChips should not be visible when no filters are active
      const filterChips = document.querySelector('[data-testid="filter-chips"]');
      const isHiddenOrAbsent =
        filterChips === null || filterChips.className.includes("hidden");
      expect(isHiddenOrAbsent).toBe(true);
    },
  );
});
