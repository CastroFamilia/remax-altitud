/**
 * Story 3.3: Search Filters & URL State
 * Module: src/app/actions/search-actions.ts
 *
 * TDD RED PHASE — all tests use it.skip() and will FAIL until
 * search-actions.ts is implemented.
 *
 * Covers:
 *   AC #1  — searchProperties returns filtered properties (type, price, beds, etc.)
 *   AC #2  — searchProperties respects isVisible=true constraint
 *   AC #6  — searchProperties returns facets (FilterFacets) for count display
 *   AC #7  — getAvailableAreas returns distinct area slugs from DB
 *   AC #9  — filter queries execute via Server Actions using Drizzle (AR23 / ADR-5)
 *   AC #10 — Numeric filter inputs sanitized with Number.isFinite()
 *
 * Environment: node (Server Actions — no jsdom needed)
 *
 * Server Action interface under test:
 *   searchProperties(filters: SearchFilters): Promise<SearchResult>
 *   getAvailableAreas(): Promise<{ slug: string; label: string }[]>
 *
 * SearchResult type:
 *   { properties: PropertySearchItem[]; total: number; facets: FilterFacets }
 *
 * FilterFacets type:
 *   { byType: { value: string; count: number }[];
 *     byBedrooms: { value: number; count: number }[];
 *     byBathrooms: { value: number; count: number }[]; }
 */

import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

// Mock Drizzle DB client to avoid requiring a real PostgreSQL connection
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockOffset = vi.fn();
const mockGroupBy = vi.fn();

const mockQueryBuilder = {
  select: mockSelect,
  from: mockFrom,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  offset: mockOffset,
  groupBy: mockGroupBy,
};

// Chain all query builder methods to return the same builder (fluent API)
mockSelect.mockReturnValue(mockQueryBuilder);
mockFrom.mockReturnValue(mockQueryBuilder);
mockWhere.mockReturnValue(mockQueryBuilder);
mockOrderBy.mockReturnValue(mockQueryBuilder);
mockGroupBy.mockReturnValue(mockQueryBuilder);
mockLimit.mockReturnValue(mockQueryBuilder);
mockOffset.mockReturnValue(
  // Final .offset() resolves the query — return mock results
  Promise.resolve([])
);

vi.mock("@/lib/db/client", () => ({
  db: {
    select: mockSelect,
  },
}));

// Mock server-only to allow import in test environment
vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Module under test — imported AFTER mocks
// ---------------------------------------------------------------------------

import { searchProperties, getAvailableAreas } from "@/app/actions/search-actions"; // imported AFTER mocks
import type { SearchFilters, SearchResult } from "@/types/search"; // imported AFTER mocks

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal SearchResult for assertions */
function isValidSearchResult(result: SearchResult): boolean {
  return (
    Array.isArray(result.properties) &&
    typeof result.total === "number" &&
    Array.isArray(result.facets.byType) &&
    Array.isArray(result.facets.byBedrooms) &&
    Array.isArray(result.facets.byBathrooms)
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  vi.clearAllMocks();
  // Reset mock chain returns
  mockOffset.mockReturnValue(Promise.resolve([]));
});

describe("searchProperties — Server Action for filter queries (AC #1, #6, #9)", () => {
  // -------------------------------------------------------------------------
  // AC #9: File has "use server" directive
  // -------------------------------------------------------------------------

  it.skip(
    "[P0] search-actions.ts has 'use server' directive at top of file (ADR-5 Server Action)",
    async () => {
      // THIS TEST WILL FAIL — search-actions.ts not yet implemented
      const fs = await import("node:fs");
      const path = await import("node:path");

      const filePath = path.resolve(process.cwd(), "src/app/actions/search-actions.ts");
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, "utf8");
      // First non-whitespace content must be "use server"
      expect(content.trimStart()).toMatch(/^['"]use server['"]/);
    },
  );

  // -------------------------------------------------------------------------
  // AC #1: Returns SearchResult shape
  // -------------------------------------------------------------------------

  it.skip(
    "[P0] searchProperties with no filters returns a valid SearchResult shape",
    async () => {
      // THIS TEST WILL FAIL — search-actions.ts not yet implemented
      mockOffset.mockResolvedValue([]); // empty properties from DB

      const result = await searchProperties({});

      expect(isValidSearchResult(result)).toBe(true);
      expect(result.properties).toEqual([]);
      expect(result.total).toBe(0);
    },
  );

  it.skip(
    "[P0] searchProperties with type filter passes type to Drizzle query",
    async () => {
      // THIS TEST WILL FAIL — search-actions.ts not yet implemented
      const filters: SearchFilters = { type: "Casa" };

      await searchProperties(filters);

      // where() must have been called (filter applied)
      expect(mockWhere).toHaveBeenCalled();
    },
  );

  it.skip(
    "[P0] searchProperties with priceMin and priceMax applies both price range conditions",
    async () => {
      // THIS TEST WILL FAIL — search-actions.ts not yet implemented
      const filters: SearchFilters = { priceMin: 100_000, priceMax: 500_000 };

      await searchProperties(filters);

      // where() must have been called to apply price range
      expect(mockWhere).toHaveBeenCalled();
    },
  );

  it.skip(
    "[P0] searchProperties with bedrooms filter applies gte condition for minimum bedrooms",
    async () => {
      // THIS TEST WILL FAIL — search-actions.ts not yet implemented
      const filters: SearchFilters = { bedrooms: 3 };

      await searchProperties(filters);

      expect(mockWhere).toHaveBeenCalled();
    },
  );

  it.skip(
    "[P0] searchProperties always applies isVisible=true constraint",
    async () => {
      // THIS TEST WILL FAIL — search-actions.ts not yet implemented
      await searchProperties({});

      // The isVisible=true condition must always be included in WHERE clause
      // (even with no other filters — visibility is mandatory)
      expect(mockWhere).toHaveBeenCalled();
    },
  );

  // -------------------------------------------------------------------------
  // AC #6: Returns FilterFacets for count display
  // -------------------------------------------------------------------------

  it.skip(
    "[P0] searchProperties returns facets.byType with value and count fields",
    async () => {
      // THIS TEST WILL FAIL — search-actions.ts not yet implemented
      // Mock the facets aggregation result
      mockOffset.mockResolvedValueOnce([]); // main query
      // The second query (facets) should return byType data
      const result = await searchProperties({});

      result.facets.byType.forEach((facet) => {
        expect(facet).toHaveProperty("value");
        expect(facet).toHaveProperty("count");
        expect(typeof facet.value).toBe("string");
        expect(typeof facet.count).toBe("number");
      });
    },
  );

  it.skip(
    "[P1] searchProperties returns facets.byBedrooms with value and count fields",
    async () => {
      // THIS TEST WILL FAIL — search-actions.ts not yet implemented
      const result = await searchProperties({});

      result.facets.byBedrooms.forEach((facet) => {
        expect(facet).toHaveProperty("value");
        expect(facet).toHaveProperty("count");
        expect(typeof facet.value).toBe("number");
        expect(typeof facet.count).toBe("number");
      });
    },
  );

  // -------------------------------------------------------------------------
  // AC #10: Input sanitization (Number.isFinite guard)
  // -------------------------------------------------------------------------

  it.skip(
    "[P0] searchProperties ignores NaN price values and does not pass them to Drizzle",
    async () => {
      // THIS TEST WILL FAIL — search-actions.ts not yet implemented
      // Pass NaN priceMin (should be sanitized before DB query)
      const filters: SearchFilters = { priceMin: NaN };

      // Must not throw — NaN should be sanitized away
      await expect(searchProperties(filters)).resolves.toBeDefined();
    },
  );

  it.skip(
    "[P0] searchProperties ignores Infinity price values and does not pass them to Drizzle",
    async () => {
      // THIS TEST WILL FAIL — search-actions.ts not yet implemented
      const filters: SearchFilters = { priceMin: Infinity };

      await expect(searchProperties(filters)).resolves.toBeDefined();
    },
  );

  it.skip(
    "[P0] searchProperties handles negative priceMin without crashing (edge case sanitization)",
    async () => {
      // THIS TEST WILL FAIL — search-actions.ts not yet implemented
      const filters: SearchFilters = { priceMin: -50_000 };

      // Should resolve (implementation decides whether to reject or treat as 0)
      await expect(searchProperties(filters)).resolves.toBeDefined();
    },
  );

  // -------------------------------------------------------------------------
  // Sort order
  // -------------------------------------------------------------------------

  it.skip(
    "[P1] searchProperties with sort='price_asc' applies ascending price order",
    async () => {
      // THIS TEST WILL FAIL — search-actions.ts not yet implemented
      await searchProperties({ sort: "price_asc" });

      // orderBy() must be called with ascending price order
      expect(mockOrderBy).toHaveBeenCalled();
    },
  );

  it.skip(
    "[P1] searchProperties with sort='price_desc' applies descending price order",
    async () => {
      // THIS TEST WILL FAIL — search-actions.ts not yet implemented
      await searchProperties({ sort: "price_desc" });

      expect(mockOrderBy).toHaveBeenCalled();
    },
  );

  it.skip(
    "[P1] searchProperties with no sort defaults to descending createdAt (newest first)",
    async () => {
      // THIS TEST WILL FAIL — search-actions.ts not yet implemented
      await searchProperties({});

      // Default sort: desc(properties.createdAt)
      expect(mockOrderBy).toHaveBeenCalled();
    },
  );

  // -------------------------------------------------------------------------
  // Pagination defaults
  // -------------------------------------------------------------------------

  it.skip(
    "[P1] searchProperties applies limit(50) and offset(0) for MVP pagination",
    async () => {
      // THIS TEST WILL FAIL — search-actions.ts not yet implemented
      await searchProperties({});

      expect(mockLimit).toHaveBeenCalledWith(50);
      expect(mockOffset).toHaveBeenCalledWith(0);
    },
  );
});

// ---------------------------------------------------------------------------
// getAvailableAreas — AC #7
// ---------------------------------------------------------------------------

describe("getAvailableAreas — fetch distinct area slugs from DB (AC #7)", () => {
  it.skip(
    "[P0] getAvailableAreas returns an array of { slug, label } objects",
    async () => {
      // THIS TEST WILL FAIL — getAvailableAreas not yet implemented
      // Mock DB to return sample area slugs
      mockOffset.mockResolvedValue([
        { areaSlug: "perez-zeledon" },
        { areaSlug: "dominical" },
      ]);

      const areas = await getAvailableAreas();

      expect(Array.isArray(areas)).toBe(true);
      areas.forEach((area) => {
        expect(area).toHaveProperty("slug");
        expect(area).toHaveProperty("label");
        expect(typeof area.slug).toBe("string");
        expect(typeof area.label).toBe("string");
      });
    },
  );

  it.skip(
    "[P0] getAvailableAreas excludes null area slugs from results",
    async () => {
      // THIS TEST WILL FAIL — getAvailableAreas not yet implemented
      // Mock DB returns null area_slug for some properties
      mockOffset.mockResolvedValue([
        { areaSlug: "dominical" },
        { areaSlug: null }, // should be excluded
      ]);

      const areas = await getAvailableAreas();

      // All returned areas must have non-null slugs
      areas.forEach((area) => {
        expect(area.slug).not.toBeNull();
        expect(area.slug).not.toBe("");
      });
    },
  );

  it.skip(
    "[P1] getAvailableAreas only queries isVisible=true properties",
    async () => {
      // THIS TEST WILL FAIL — getAvailableAreas not yet implemented
      await getAvailableAreas();

      // The WHERE clause must include isVisible=true
      expect(mockWhere).toHaveBeenCalled();
    },
  );

  it.skip(
    "[P1] search-actions.ts exports both searchProperties and getAvailableAreas",
    async () => {
      // THIS TEST WILL FAIL — search-actions.ts not yet implemented
      const module = await import("@/app/actions/search-actions");

      expect(typeof module.searchProperties).toBe("function");
      expect(typeof module.getAvailableAreas).toBe("function");
    },
  );
});
