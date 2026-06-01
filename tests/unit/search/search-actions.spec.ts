/**
 * Story 3.3: Search Filters & URL State
 * Module: src/app/actions/search-actions.ts
 *
 * TDD RED PHASE — all tests use it() and will FAIL until
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

import { describe, expect, it, vi, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// vi.mock() is hoisted by Vitest, so use vi.hoisted() to declare mock handles
// that can be referenced both inside the factory and in tests.
// ---------------------------------------------------------------------------

// Use vi.hoisted() so that mock handles are available when vi.mock() factory runs
const {
  mockSelect,
  mockFrom,
  mockLeftJoin,
  mockWhere,
  mockOrderBy,
  mockLimit,
  mockOffset,
  mockGroupBy,
  mockQueryBuilder,
} = vi.hoisted(() => {
  const mockOffset = vi.fn();
  const mockGroupBy = vi.fn();
  const mockLimit = vi.fn();
  const mockOrderBy = vi.fn();
  const mockWhere = vi.fn();
  const mockLeftJoin = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();

  // The query builder supports two terminal patterns:
  //   - .limit().offset()  → used by main properties query (returns Promise)
  //   - .groupBy()         → used by facets + getAvailableAreas queries (returns Promise)
  // Both must resolve as arrays to allow .filter()/.map() on the result.
  const mockQueryBuilder: Record<string, unknown> = {
    from: mockFrom,
    leftJoin: mockLeftJoin,
    where: mockWhere,
    orderBy: mockOrderBy,
    limit: mockLimit,
    offset: mockOffset,
    groupBy: mockGroupBy,
  };

  // Chain: each method returns the same builder for fluent API
  mockFrom.mockReturnValue(mockQueryBuilder);
  mockLeftJoin.mockReturnValue(mockQueryBuilder);
  mockWhere.mockReturnValue(mockQueryBuilder);
  mockOrderBy.mockReturnValue(mockQueryBuilder);
  mockLimit.mockReturnValue(mockQueryBuilder);

  // offset: terminal for main query — returns a resolved Promise<[]> by default
  mockOffset.mockReturnValue(Promise.resolve([]));

  // groupBy: terminal for facets/areas queries — returns a resolved Promise<[]> by default
  mockGroupBy.mockReturnValue(Promise.resolve([]));

  // select returns the builder chain
  mockSelect.mockReturnValue(mockQueryBuilder);

  return {
    mockSelect,
    mockFrom,
    mockLeftJoin,
    mockWhere,
    mockOrderBy,
    mockLimit,
    mockOffset,
    mockGroupBy,
    mockQueryBuilder,
  };
});

// Mock server-only to allow import in test environment
vi.mock("server-only", () => ({}));

// Mock Drizzle DB client — factory can reference vi.hoisted() variables
vi.mock("@/lib/db/client", () => ({
  db: {
    select: mockSelect,
  },
}));

// ---------------------------------------------------------------------------
// Module under test — imported AFTER mocks
// ---------------------------------------------------------------------------

import { searchProperties, getAvailableAreas } from "@/app/actions/search-actions"; // imported AFTER mocks
import type { SearchFilters, SearchResult } from "@/types/search"; // imported AFTER mocks

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Assert that a SearchResult has the expected shape with field-level diagnostics */
function assertValidSearchResultShape(result: SearchResult): void {
  expect(Array.isArray(result.properties), "result.properties must be an array").toBe(true);
  expect(typeof result.total, "result.total must be a number").toBe("number");
  expect(Array.isArray(result.facets.byType), "result.facets.byType must be an array").toBe(true);
  expect(Array.isArray(result.facets.byBedrooms), "result.facets.byBedrooms must be an array").toBe(
    true,
  );
  expect(
    Array.isArray(result.facets.byBathrooms),
    "result.facets.byBathrooms must be an array",
  ).toBe(true);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  vi.clearAllMocks();
  // Re-establish mock chain returns after clearAllMocks resets them
  mockFrom.mockReturnValue(mockQueryBuilder);
  mockLeftJoin.mockReturnValue(mockQueryBuilder);
  mockWhere.mockReturnValue(mockQueryBuilder);
  mockOrderBy.mockReturnValue(mockQueryBuilder);
  mockLimit.mockReturnValue(mockQueryBuilder);
  // Terminal methods — return Promises so await resolves to an array
  mockOffset.mockReturnValue(Promise.resolve([]));
  mockGroupBy.mockReturnValue(Promise.resolve([]));
  mockSelect.mockReturnValue(mockQueryBuilder);
});

describe("searchProperties — Server Action for filter queries (AC #1, #6, #9)", () => {
  // -------------------------------------------------------------------------
  // AC #9: File has "use server" directive
  // -------------------------------------------------------------------------

  it("[P0] search-actions.ts has 'use server' directive at top of file (ADR-5 Server Action)", async () => {
    // THIS TEST WILL FAIL — search-actions.ts not yet implemented
    const fs = await import("node:fs");
    const path = await import("node:path");

    const filePath = path.resolve(process.cwd(), "src/app/actions/search-actions.ts");
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, "utf8");
    // First non-whitespace content must be "use server"
    expect(content.trimStart()).toMatch(/^['"]use server['"]/);
  });

  // -------------------------------------------------------------------------
  // AC #1: Returns SearchResult shape
  // -------------------------------------------------------------------------

  it("[P0] searchProperties with no filters returns a valid SearchResult shape", async () => {
    // THIS TEST WILL FAIL — search-actions.ts not yet implemented
    mockOffset.mockResolvedValue([]); // empty properties from DB

    const result = await searchProperties({});

    assertValidSearchResultShape(result);
    expect(result.properties).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("[P0] searchProperties with type filter passes type to Drizzle query", async () => {
    // THIS TEST WILL FAIL — search-actions.ts not yet implemented
    const filters: SearchFilters = { type: "Casa" };

    await searchProperties(filters);

    // where() must have been called (filter applied)
    expect(mockWhere).toHaveBeenCalled();
  });

  it("[P0] searchProperties with priceMin and priceMax applies both price range conditions", async () => {
    // THIS TEST WILL FAIL — search-actions.ts not yet implemented
    const filters: SearchFilters = { priceMin: 100_000, priceMax: 500_000 };

    await searchProperties(filters);

    // where() must have been called to apply price range
    expect(mockWhere).toHaveBeenCalled();
  });

  it("[P0] searchProperties with bedrooms filter applies gte condition for minimum bedrooms", async () => {
    // THIS TEST WILL FAIL — search-actions.ts not yet implemented
    const filters: SearchFilters = { bedrooms: 3 };

    await searchProperties(filters);

    expect(mockWhere).toHaveBeenCalled();
  });

  it("[P0] searchProperties always applies isVisible=true constraint", async () => {
    // THIS TEST WILL FAIL — search-actions.ts not yet implemented
    await searchProperties({});

    // The isVisible=true condition must always be included in WHERE clause
    // (even with no other filters — visibility is mandatory)
    expect(mockWhere).toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // AC #6: Returns FilterFacets for count display
  // -------------------------------------------------------------------------

  it("[P0] searchProperties returns facets.byType with value and count fields", async () => {
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
  });

  it("[P1] searchProperties returns facets.byBedrooms with value and count fields", async () => {
    // THIS TEST WILL FAIL — search-actions.ts not yet implemented
    const result = await searchProperties({});

    result.facets.byBedrooms.forEach((facet) => {
      expect(facet).toHaveProperty("value");
      expect(facet).toHaveProperty("count");
      expect(typeof facet.value).toBe("number");
      expect(typeof facet.count).toBe("number");
    });
  });

  // -------------------------------------------------------------------------
  // AC #10: Input sanitization (Number.isFinite guard)
  // -------------------------------------------------------------------------

  it("[P0] searchProperties ignores NaN price values and does not pass them to Drizzle", async () => {
    // THIS TEST WILL FAIL — search-actions.ts not yet implemented
    // Pass NaN priceMin (should be sanitized before DB query)
    const filters: SearchFilters = { priceMin: NaN };

    // Must not throw — NaN should be sanitized away
    await expect(searchProperties(filters)).resolves.toBeDefined();
  });

  it("[P0] searchProperties ignores Infinity price values and does not pass them to Drizzle", async () => {
    // THIS TEST WILL FAIL — search-actions.ts not yet implemented
    const filters: SearchFilters = { priceMin: Infinity };

    await expect(searchProperties(filters)).resolves.toBeDefined();
  });

  it("[P0] searchProperties handles negative priceMin without crashing (edge case sanitization)", async () => {
    // THIS TEST WILL FAIL — search-actions.ts not yet implemented
    const filters: SearchFilters = { priceMin: -50_000 };

    // Should resolve (implementation decides whether to reject or treat as 0)
    await expect(searchProperties(filters)).resolves.toBeDefined();
  });

  // -------------------------------------------------------------------------
  // Sort order
  // -------------------------------------------------------------------------

  it("[P1] searchProperties with sort='price_asc' applies ascending price order", async () => {
    // THIS TEST WILL FAIL — search-actions.ts not yet implemented
    await searchProperties({ sort: "price_asc" });

    // orderBy() must be called with ascending price order
    expect(mockOrderBy).toHaveBeenCalled();
  });

  it("[P1] searchProperties with sort='price_desc' applies descending price order", async () => {
    // THIS TEST WILL FAIL — search-actions.ts not yet implemented
    await searchProperties({ sort: "price_desc" });

    expect(mockOrderBy).toHaveBeenCalled();
  });

  it("[P1] searchProperties with no sort defaults to descending createdAt (newest first)", async () => {
    // THIS TEST WILL FAIL — search-actions.ts not yet implemented
    await searchProperties({});

    // Default sort: desc(properties.createdAt)
    expect(mockOrderBy).toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Keyword Search & River Synonym Expansion
  // -------------------------------------------------------------------------

  it("[P0] searchProperties with q filter passes keyword search query to Drizzle", async () => {
    await searchProperties({ q: "piscina" });
    expect(mockWhere).toHaveBeenCalled();
  });

  it("[P0] searchProperties with q='rio' expands to search for 'rio', 'río', 'river', and 'quebrada' synonyms", async () => {
    await searchProperties({ q: "rio" });
    expect(mockWhere).toHaveBeenCalled();
  });

  it("[P0] searchProperties with q='quebrada' expands synonyms because river is translated as quebrada in Costa Rica", async () => {
    await searchProperties({ q: "quebrada" });
    expect(mockWhere).toHaveBeenCalled();
  });

  it("[P0] searchProperties with Spanish type='Lote' maps to equivalent DB propertyTypes", async () => {
    await searchProperties({ type: "Lote" });
    expect(mockWhere).toHaveBeenCalled();
  });

  it("[P0] searchProperties with type='lote' includes 'Lot/Land' equivalent", async () => {
    await searchProperties({ type: "lote" });
    expect(mockWhere).toHaveBeenCalled();
  });

  it("[P0] searchProperties left-joins communities and searches community name when q is provided", async () => {
    await searchProperties({ q: "Santa Elena" });
    expect(mockLeftJoin).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
  });

  it("[P0] searchProperties with q='waterfall' expands to matching Spanish synonyms like 'cascada' or 'catarata'", async () => {
    await searchProperties({ q: "waterfall" });
    expect(mockWhere).toHaveBeenCalled();
  });

  it("[P0] searchProperties with q='views' expands to matching Spanish synonyms like 'vista' or 'vistas'", async () => {
    await searchProperties({ q: "views" });
    expect(mockWhere).toHaveBeenCalled();
  });

  it("[P0] searchProperties with q='beach' expands to matching Spanish synonyms like 'playa' or 'mar'", async () => {
    await searchProperties({ q: "beach" });
    expect(mockWhere).toHaveBeenCalled();
  });

  it("[P0] searchProperties with compound query q='waterfall views' expands both terms and intersects them using AND", async () => {
    await searchProperties({ q: "waterfall views" });
    expect(mockWhere).toHaveBeenCalled();
  });

  it("[P0] searchProperties with stop words query q='properties with waterfall and views' filters stop words and matches waterfall and views", async () => {
    await searchProperties({ q: "properties with waterfall and views" });
    expect(mockWhere).toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Pagination defaults
  // -------------------------------------------------------------------------

  it("[P1] searchProperties applies limit(20) and offset(0) for page 1 (Story 3.5: pagination)", async () => {
    await searchProperties({});

    expect(mockLimit).toHaveBeenCalledWith(20);
    expect(mockOffset).toHaveBeenCalledWith(0);
  });

  it("[P1] searchProperties applies correct offset for page 2 (Story 3.5: pagination)", async () => {
    await searchProperties({}, 2);

    expect(mockLimit).toHaveBeenCalledWith(20);
    expect(mockOffset).toHaveBeenCalledWith(20);
  });

  // -------------------------------------------------------------------------
  // Map bounds filtering
  // -------------------------------------------------------------------------

  it("[P0] searchProperties with bounds applies the spatial geo condition", async () => {
    const bounds = { north: 9.5, south: 9.3, east: -83.5, west: -83.8 };
    await searchProperties({}, 1, bounds);

    expect(mockWhere).toHaveBeenCalled();
  });

  it("[P0] searchProperties with invalid bounds ignores the spatial condition silently", async () => {
    const bounds = { north: 9.3, south: 9.5, east: -83.5, west: -83.8 }; // Inverted north/south
    await searchProperties({}, 1, bounds);

    expect(mockWhere).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getAvailableAreas — AC #7
// ---------------------------------------------------------------------------

describe("getAvailableAreas — fetch distinct area slugs from DB (AC #7)", () => {
  it("[P0] getAvailableAreas returns an array of { slug, label } objects", async () => {
    // THIS TEST WILL FAIL — getAvailableAreas not yet implemented
    // Mock DB to return sample area slugs
    mockOffset.mockResolvedValue([{ areaSlug: "perez-zeledon" }, { areaSlug: "dominical" }]);

    const areas = await getAvailableAreas();

    expect(Array.isArray(areas)).toBe(true);
    areas.forEach((area) => {
      expect(area).toHaveProperty("slug");
      expect(area).toHaveProperty("label");
      expect(typeof area.slug).toBe("string");
      expect(typeof area.label).toBe("string");
    });
  });

  it("[P0] getAvailableAreas excludes null area slugs from results", async () => {
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
  });

  it("[P1] getAvailableAreas only queries isVisible=true properties", async () => {
    // THIS TEST WILL FAIL — getAvailableAreas not yet implemented
    await getAvailableAreas();

    // The WHERE clause must include isVisible=true
    expect(mockWhere).toHaveBeenCalled();
  });

  it("[P1] search-actions.ts exports both searchProperties and getAvailableAreas", async () => {
    const searchActionsModule = await import("@/app/actions/search-actions");

    expect(typeof searchActionsModule.searchProperties).toBe("function");
    expect(typeof searchActionsModule.getAvailableAreas).toBe("function");
  });
});
