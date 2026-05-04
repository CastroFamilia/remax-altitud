/**
 * Story 3.3: Search Filters & URL State
 * Hook: src/hooks/use-search-filters.ts
 *
 * TDD RED PHASE — all tests use it() and will FAIL until
 * use-search-filters.ts is implemented.
 *
 * Covers:
 *   AC #3  — Dropdown/checkbox filters update instantly (no debounce)
 *   AC #4  — Price slider updates with 300ms debounce
 *   AC #5  — clearAll removes all filter params except 'view'
 *   AC #8  — All filter states serialized into URL query params
 *
 * Environment: jsdom (hook uses useSearchParams / useRouter from next/navigation)
 *
 * Hook interface under test:
 *   useSearchFilters(): {
 *     filters: SearchFilters;
 *     setFilter<K>(key: K, value: SearchFilters[K] | undefined): void;
 *     clearFilter(key: keyof SearchFilters): void;
 *     clearAll(): void;
 *     activeFilterCount: number; // excludes 'view' and 'sort'
 *   }
 *
 * NOTE: Use .tsx extension — hooks using useSearchParams need React/jsdom context.
 */

import { describe, expect, it, vi, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

const mockReplace = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ replace: mockReplace })),
  useSearchParams: vi.fn(() => mockSearchParams),
  usePathname: vi.fn(() => "/en/search"),
}));

// ---------------------------------------------------------------------------
// Hook under test — imported AFTER mocks
// ---------------------------------------------------------------------------

import { useSearchFilters } from "@/hooks/use-search-filters"; // imported AFTER mocks

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Capture the URL passed to router.replace() */
function getLastReplaceUrl(): URLSearchParams {
  const calls = mockReplace.mock.calls;
  if (calls.length === 0) return new URLSearchParams();
  const lastArg = calls[calls.length - 1][0] as string;
  const queryString = lastArg.includes("?") ? lastArg.split("?")[1] : lastArg;
  return new URLSearchParams(queryString);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  // Reset shared searchParams mock between tests
  ;[...mockSearchParams.keys()].forEach((k) => mockSearchParams.delete(k));
});

describe("useSearchFilters — URL filter state hook (AC #3, #4, #5, #8)", () => {
  // -------------------------------------------------------------------------
  // AC #8: Parse filters from URL params correctly
  // -------------------------------------------------------------------------

  describe("filters — parsed from URL params (AC #8)", () => {
    it(
      "[P0] returns empty filters when URL has no filter params",
      () => {
        // THIS TEST WILL FAIL — use-search-filters.ts not yet implemented
        const { result } = renderHook(() => useSearchFilters());

        expect(result.current.filters).toEqual({});
      },
    );

    it(
      "[P0] parses 'type' filter from URL param correctly",
      () => {
        // THIS TEST WILL FAIL — use-search-filters.ts not yet implemented
        mockSearchParams.set("type", "Casa");

        const { result } = renderHook(() => useSearchFilters());

        expect(result.current.filters.type).toBe("Casa");
      },
    );

    it(
      "[P0] parses 'price_min' and 'price_max' as numbers from URL params",
      () => {
        // THIS TEST WILL FAIL — use-search-filters.ts not yet implemented
        mockSearchParams.set("price_min", "100000");
        mockSearchParams.set("price_max", "500000");

        const { result } = renderHook(() => useSearchFilters());

        expect(result.current.filters.priceMin).toBe(100000);
        expect(result.current.filters.priceMax).toBe(500000);
      },
    );

    it(
      "[P0] parses 'bedrooms' as a number from URL param",
      () => {
        // THIS TEST WILL FAIL — use-search-filters.ts not yet implemented
        mockSearchParams.set("bedrooms", "3");

        const { result } = renderHook(() => useSearchFilters());

        expect(result.current.filters.bedrooms).toBe(3);
      },
    );

    it(
      "[P0] parses 'bathrooms' as a number from URL param",
      () => {
        // THIS TEST WILL FAIL — use-search-filters.ts not yet implemented
        mockSearchParams.set("bathrooms", "2");

        const { result } = renderHook(() => useSearchFilters());

        expect(result.current.filters.bathrooms).toBe(2);
      },
    );

    it(
      "[P0] parses 'area' areaSlug from URL param",
      () => {
        // THIS TEST WILL FAIL — use-search-filters.ts not yet implemented
        mockSearchParams.set("area", "perez-zeledon");

        const { result } = renderHook(() => useSearchFilters());

        expect(result.current.filters.areaSlug).toBe("perez-zeledon");
      },
    );

    it(
      "[P1] parses 'sort' from URL param as SortOption",
      () => {
        // THIS TEST WILL FAIL — use-search-filters.ts not yet implemented
        mockSearchParams.set("sort", "price_asc");

        const { result } = renderHook(() => useSearchFilters());

        expect(result.current.filters.sort).toBe("price_asc");
      },
    );

    it(
      "[P1] ignores non-finite price_min values (guard against NaN)",
      () => {
        // THIS TEST WILL FAIL — use-search-filters.ts not yet implemented
        mockSearchParams.set("price_min", "not-a-number");

        const { result } = renderHook(() => useSearchFilters());

        // priceMin should be undefined (not NaN) when the param is invalid
        expect(result.current.filters.priceMin).toBeUndefined();
      },
    );
  });

  // -------------------------------------------------------------------------
  // AC #3 & #8: setFilter — instant URL updates for dropdown filters
  // -------------------------------------------------------------------------

  describe("setFilter — URL write (AC #3, #8)", () => {
    it(
      "[P0] setFilter('type', 'Casa') calls router.replace with type=Casa in URL",
      async () => {
        // THIS TEST WILL FAIL — use-search-filters.ts not yet implemented
        const { result } = renderHook(() => useSearchFilters());

        await act(async () => {
          result.current.setFilter("type", "Casa");
        });

        const params = getLastReplaceUrl();
        expect(params.get("type")).toBe("Casa");
      },
    );

    it(
      "[P0] setFilter merges new filter value with existing URL params (does NOT wipe other params)",
      async () => {
        // THIS TEST WILL FAIL — use-search-filters.ts not yet implemented
        mockSearchParams.set("bedrooms", "2");
        mockSearchParams.set("sort", "newest");

        const { result } = renderHook(() => useSearchFilters());

        await act(async () => {
          result.current.setFilter("type", "Apartamento");
        });

        const params = getLastReplaceUrl();
        expect(params.get("type")).toBe("Apartamento");
        // Existing params must be preserved
        expect(params.get("bedrooms")).toBe("2");
        expect(params.get("sort")).toBe("newest");
      },
    );

    it(
      "[P0] setFilter with undefined value removes that param from URL",
      async () => {
        // THIS TEST WILL FAIL — use-search-filters.ts not yet implemented
        mockSearchParams.set("type", "Casa");

        const { result } = renderHook(() => useSearchFilters());

        await act(async () => {
          result.current.setFilter("type", undefined);
        });

        const params = getLastReplaceUrl();
        expect(params.has("type")).toBe(false);
      },
    );

    it(
      "[P0] setFilter('bedrooms', 3) writes 'bedrooms=3' to URL",
      async () => {
        // THIS TEST WILL FAIL — use-search-filters.ts not yet implemented
        const { result } = renderHook(() => useSearchFilters());

        await act(async () => {
          result.current.setFilter("bedrooms", 3);
        });

        const params = getLastReplaceUrl();
        expect(params.get("bedrooms")).toBe("3");
      },
    );
  });

  // -------------------------------------------------------------------------
  // AC #5: clearFilter and clearAll
  // -------------------------------------------------------------------------

  describe("clearFilter and clearAll (AC #5)", () => {
    it(
      "[P0] clearFilter('type') removes only the type param from URL",
      async () => {
        // THIS TEST WILL FAIL — use-search-filters.ts not yet implemented
        mockSearchParams.set("type", "Lote");
        mockSearchParams.set("bedrooms", "2");

        const { result } = renderHook(() => useSearchFilters());

        await act(async () => {
          result.current.clearFilter("type");
        });

        const params = getLastReplaceUrl();
        expect(params.has("type")).toBe(false);
        // Other params preserved
        expect(params.get("bedrooms")).toBe("2");
      },
    );

    it(
      "[P0] clearAll removes all filter params except 'view'",
      async () => {
        // THIS TEST WILL FAIL — use-search-filters.ts not yet implemented
        mockSearchParams.set("type", "Casa");
        mockSearchParams.set("price_min", "100000");
        mockSearchParams.set("bedrooms", "3");
        mockSearchParams.set("view", "split");

        const { result } = renderHook(() => useSearchFilters());

        await act(async () => {
          result.current.clearAll();
        });

        const params = getLastReplaceUrl();
        // Filter params must be gone
        expect(params.has("type")).toBe(false);
        expect(params.has("price_min")).toBe(false);
        expect(params.has("bedrooms")).toBe(false);
        // 'view' MUST be preserved (it's not a filter — AR10)
        expect(params.get("view")).toBe("split");
      },
    );

    it(
      "[P0] clearAll removes 'tags' param (Story 3.4 — tags are filters, not UI state)",
      async () => {
        // Regression guard: tags must be cleared by clearAll, not preserved like 'view'
        mockSearchParams.set("type", "Casa");
        mockSearchParams.set("tags", "Investment Property,Rental Potential");
        mockSearchParams.set("view", "split");

        const { result } = renderHook(() => useSearchFilters());

        await act(async () => {
          result.current.clearAll();
        });

        const params = getLastReplaceUrl();
        // Tags must be cleared (they are filters, not UI state)
        expect(params.has("tags")).toBe(false);
        expect(params.has("type")).toBe(false);
        // 'view' MUST be preserved (AR10)
        expect(params.get("view")).toBe("split");
      },
    );
  });

  // -------------------------------------------------------------------------
  // activeFilterCount — excludes 'view' and 'sort'
  // -------------------------------------------------------------------------

  describe("activeFilterCount — excludes view and sort (AC #5)", () => {
    it(
      "[P0] activeFilterCount is 0 when no filters are set",
      () => {
        // THIS TEST WILL FAIL — use-search-filters.ts not yet implemented
        const { result } = renderHook(() => useSearchFilters());

        expect(result.current.activeFilterCount).toBe(0);
      },
    );

    it(
      "[P0] activeFilterCount is 1 when only 'type' is set",
      () => {
        // THIS TEST WILL FAIL — use-search-filters.ts not yet implemented
        mockSearchParams.set("type", "Lote");

        const { result } = renderHook(() => useSearchFilters());

        expect(result.current.activeFilterCount).toBe(1);
      },
    );

    it(
      "[P0] activeFilterCount does NOT count 'view' param (view is not a filter)",
      () => {
        // THIS TEST WILL FAIL — use-search-filters.ts not yet implemented
        mockSearchParams.set("view", "map");

        const { result } = renderHook(() => useSearchFilters());

        expect(result.current.activeFilterCount).toBe(0);
      },
    );

    it(
      "[P1] activeFilterCount does NOT count 'sort' param (sort is not a filter chip)",
      () => {
        // THIS TEST WILL FAIL — use-search-filters.ts not yet implemented
        mockSearchParams.set("sort", "price_asc");

        const { result } = renderHook(() => useSearchFilters());

        expect(result.current.activeFilterCount).toBe(0);
      },
    );

    it(
      "[P0] activeFilterCount correctly counts multiple filters",
      () => {
        // THIS TEST WILL FAIL — use-search-filters.ts not yet implemented
        mockSearchParams.set("type", "Casa");
        mockSearchParams.set("price_min", "100000");
        mockSearchParams.set("bedrooms", "3");
        mockSearchParams.set("view", "split"); // must NOT be counted
        mockSearchParams.set("sort", "newest"); // must NOT be counted

        const { result } = renderHook(() => useSearchFilters());

        expect(result.current.activeFilterCount).toBe(3);
      },
    );
  });

  // -------------------------------------------------------------------------
  // Architecture compliance
  // -------------------------------------------------------------------------

  it(
    "[P1] hook file starts with 'use client' directive (Client Component only)",
    async () => {
      // THIS TEST WILL FAIL — use-search-filters.ts not yet implemented
      const fs = await import("node:fs");
      const path = await import("node:path");

      const hookPath = path.resolve(process.cwd(), "src/hooks/use-search-filters.ts");
      expect(fs.existsSync(hookPath)).toBe(true);

      const content = fs.readFileSync(hookPath, "utf8");
      expect(content.trimStart()).toMatch(/^['"]use client['"]/);
    },
  );
});

// ---------------------------------------------------------------------------
// Story 3.4 additions: tags URL param + toggleTag helper
// ---------------------------------------------------------------------------

describe("useSearchFilters — Story 3.4: tags URL param and toggleTag (AC #2, #3, #6)", () => {
  // -------------------------------------------------------------------------
  // Tags URL param parsing (AC #3, #8)
  // -------------------------------------------------------------------------

  describe("filters.tags — parsed from URL params", () => {
    it(
      "[P0] parses 'tags' param as string[] from comma-separated URL value",
      () => {
        // THIS TEST WILL FAIL — tags support not yet added to use-search-filters.ts
        mockSearchParams.set("tags", "Investment Property,Rental Potential");

        const { result } = renderHook(() => useSearchFilters());

        expect(result.current.filters.tags).toEqual(["Investment Property", "Rental Potential"]);
      },
    );

    it(
      "[P0] parses single 'tags' value as string[] with one element",
      () => {
        // THIS TEST WILL FAIL — tags support not yet added to use-search-filters.ts
        mockSearchParams.set("tags", "Vacation Home");

        const { result } = renderHook(() => useSearchFilters());

        expect(result.current.filters.tags).toEqual(["Vacation Home"]);
      },
    );

    it(
      "[P0] returns undefined for filters.tags when tags param is absent",
      () => {
        // THIS TEST WILL FAIL — tags support not yet added to use-search-filters.ts
        const { result } = renderHook(() => useSearchFilters());

        expect(result.current.filters.tags).toBeUndefined();
      },
    );

    it(
      "[P0] trims whitespace from parsed tag values",
      () => {
        // THIS TEST WILL FAIL — tags parsing not yet implemented
        mockSearchParams.set("tags", " Investment Property , Rental Potential ");

        const { result } = renderHook(() => useSearchFilters());

        expect(result.current.filters.tags).toEqual(["Investment Property", "Rental Potential"]);
      },
    );

    it(
      "[P0] filters out empty strings from parsed tags",
      () => {
        // THIS TEST WILL FAIL — tags parsing not yet implemented
        mockSearchParams.set("tags", "Investment Property,,Rental Potential");

        const { result } = renderHook(() => useSearchFilters());

        expect(result.current.filters.tags).toEqual(["Investment Property", "Rental Potential"]);
      },
    );
  });

  // -------------------------------------------------------------------------
  // toggleTag helper (AC #2)
  // -------------------------------------------------------------------------

  describe("toggleTag — add/remove tag from URL state", () => {
    it(
      "[P0] toggleTag adds a new tag to URL when tag is not currently active",
      async () => {
        // THIS TEST WILL FAIL — toggleTag not yet added to use-search-filters.ts
        const { result } = renderHook(() => useSearchFilters());

        await act(async () => {
          result.current.toggleTag("Investment Property");
        });

        const params = getLastReplaceUrl();
        expect(params.get("tags")).toContain("Investment Property");
      },
    );

    it(
      "[P0] toggleTag removes an existing tag from URL when tag is currently active",
      async () => {
        // THIS TEST WILL FAIL — toggleTag not yet added to use-search-filters.ts
        mockSearchParams.set("tags", "Investment Property,Rental Potential");

        const { result } = renderHook(() => useSearchFilters());

        await act(async () => {
          result.current.toggleTag("Investment Property");
        });

        const params = getLastReplaceUrl();
        // Investment Property must be removed, Rental Potential must remain
        expect(params.get("tags")).not.toContain("Investment Property");
        expect(params.get("tags")).toContain("Rental Potential");
      },
    );

    it(
      "[P0] toggleTag removes the tags param entirely when the last tag is deselected",
      async () => {
        // THIS TEST WILL FAIL — toggleTag not yet added to use-search-filters.ts
        mockSearchParams.set("tags", "Investment Property");

        const { result } = renderHook(() => useSearchFilters());

        await act(async () => {
          result.current.toggleTag("Investment Property");
        });

        const params = getLastReplaceUrl();
        // tags param must be absent (not empty string)
        expect(params.has("tags")).toBe(false);
      },
    );

    it(
      "[P0] toggleTag preserves other URL params when adding a tag",
      async () => {
        // THIS TEST WILL FAIL — toggleTag not yet added to use-search-filters.ts
        mockSearchParams.set("type", "Casa");
        mockSearchParams.set("bedrooms", "3");

        const { result } = renderHook(() => useSearchFilters());

        await act(async () => {
          result.current.toggleTag("Rental Potential");
        });

        const params = getLastReplaceUrl();
        // Other params must be preserved
        expect(params.get("type")).toBe("Casa");
        expect(params.get("bedrooms")).toBe("3");
        expect(params.get("tags")).toContain("Rental Potential");
      },
    );

    it(
      "[P1] toggleTag is exposed on the useSearchFilters return object",
      () => {
        // THIS TEST WILL FAIL — toggleTag not yet added to UseSearchFiltersReturn interface
        const { result } = renderHook(() => useSearchFilters());

        expect(typeof result.current.toggleTag).toBe("function");
      },
    );
  });

  // -------------------------------------------------------------------------
  // activeFilterCount includes tags count (AC #6)
  // -------------------------------------------------------------------------

  describe("activeFilterCount — includes individual tag count (AC #6)", () => {
    it(
      "[P0] activeFilterCount counts each selected tag individually (2 tags = +2 to count)",
      () => {
        // THIS TEST WILL FAIL — activeFilterCount not yet extended for tags
        mockSearchParams.set("tags", "Investment Property,Rental Potential");

        const { result } = renderHook(() => useSearchFilters());

        // 2 tags = activeFilterCount should be 2
        expect(result.current.activeFilterCount).toBe(2);
      },
    );

    it(
      "[P0] activeFilterCount counts scalar filters + individual tags (type=Casa, 2 tags = 3 total)",
      () => {
        // THIS TEST WILL FAIL — activeFilterCount not yet extended for tags
        mockSearchParams.set("type", "Casa");
        mockSearchParams.set("tags", "Investment Property,Rental Potential");

        const { result } = renderHook(() => useSearchFilters());

        // type (1) + 2 tags = 3
        expect(result.current.activeFilterCount).toBe(3);
      },
    );

    it(
      "[P0] activeFilterCount is 1 when only one tag is selected",
      () => {
        // THIS TEST WILL FAIL — activeFilterCount not yet extended for tags
        mockSearchParams.set("tags", "Vacation Home");

        const { result } = renderHook(() => useSearchFilters());

        expect(result.current.activeFilterCount).toBe(1);
      },
    );

    it(
      "[P1] tags are NOT counted in FILTER_KEYS (do not double-count as a single key + individual)",
      () => {
        // THIS TEST WILL FAIL — FILTER_KEYS must exclude 'tags'
        mockSearchParams.set("tags", "Investment Property");

        const { result } = renderHook(() => useSearchFilters());

        // Should be 1 (one tag), not 2 (one key + one tag)
        expect(result.current.activeFilterCount).toBe(1);
      },
    );
  });

  // -------------------------------------------------------------------------
  // buildSearchUrl helper (exported from use-search-filters.ts for preset URL generation)
  // -------------------------------------------------------------------------

  describe("buildSearchUrl — exported URL builder for preset navigation (AC #5)", () => {
    it(
      "[P0] buildSearchUrl exports are available from use-search-filters module",
      async () => {
        // THIS TEST WILL FAIL — buildSearchUrl not yet exported from use-search-filters.ts
        const hookModule = await import("@/hooks/use-search-filters");
        expect(typeof hookModule.buildSearchUrl).toBe("function");
      },
    );

    it(
      "[P1] buildSearchUrl serializes tags array as comma-separated 'tags' param",
      async () => {
        // THIS TEST WILL FAIL — buildSearchUrl not yet implemented
        const { buildSearchUrl } = await import("@/hooks/use-search-filters");
        const url = buildSearchUrl("/en/search", { tags: ["Retire", "Investment Property"] });

        expect(url).toContain("tags=");
        expect(url).toContain("Retire");
        expect(url).toContain("Investment");
      },
    );

    it(
      "[P1] buildSearchUrl serializes areaSlug as 'area' URL param",
      async () => {
        // THIS TEST WILL FAIL — buildSearchUrl not yet implemented
        const { buildSearchUrl } = await import("@/hooks/use-search-filters");
        const url = buildSearchUrl("/en/search", { areaSlug: "perez-zeledon" });

        expect(url).toContain("area=perez-zeledon");
      },
    );
  });
});
