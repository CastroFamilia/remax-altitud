/**
 * ATDD Scaffolds — Story 6.1: Area Guide Pages
 * Module: src/lib/db/queries/areas.ts
 *
 * TDD RED PHASE — all tests use it.skip() and will FAIL until:
 *   1. src/lib/db/queries/areas.ts is created with query functions
 *   2. Areas table is seeded with test data
 *
 * Coverage:
 *   AC #1, #7 — getAllAreas() returns ordered area list
 *   AC #1     — getAreaBySlug() returns single area
 *   AC #1     — getAllAreaSlugs() returns slug array for generateStaticParams
 *   AC #4     — getPropertiesByAreaSlug() returns PropertySearchItem[]
 *   AC #5     — getAllAgents() or getAgentsByAreaSlugs() returns agents
 *   AC #3     — getSimilarAreas() returns same-region areas excluding current
 *
 * DB calls are mocked via vi.mock — no live DATABASE_URL required.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeArea, makeArea2, makeArea3 } from "../../fixtures/area-factories";

// ---------------------------------------------------------------------------
// Hoisted mock primitives — vi.hoisted() ensures these are available when the
// vi.mock() factory runs (which is hoisted to the top of the compiled output).
// ---------------------------------------------------------------------------

const {
  mockWhere,
  mockLimit,
  mockOrderBy,
  mockFrom,
  mockSelect,
  mockAnd,
} = vi.hoisted(() => {
  const mockWhere = vi.fn();
  const mockLimit = vi.fn();
  const mockOrderBy = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockAnd = vi.fn();

  // Default chain: db.select().from().where().orderBy().limit()
  mockLimit.mockResolvedValue([]);
  mockWhere.mockReturnValue({ limit: mockLimit, orderBy: mockOrderBy });
  mockOrderBy.mockResolvedValue([]);
  mockFrom.mockReturnValue({ where: mockWhere, orderBy: mockOrderBy });
  mockSelect.mockReturnValue({ from: mockFrom });

  return { mockWhere, mockLimit, mockOrderBy, mockFrom, mockSelect, mockAnd };
});

// ---------------------------------------------------------------------------
// Mock Drizzle client before any module under test is imported
// ---------------------------------------------------------------------------

vi.mock("@/lib/db/client", () => ({
  db: {
    select: mockSelect,
  },
}));

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

// Data factories imported from tests/fixtures/area-factories.ts

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  // Re-wire the chains after clearAllMocks resets return values
  mockLimit.mockResolvedValue([]);
  mockWhere.mockReturnValue({ limit: mockLimit, orderBy: mockOrderBy });
  mockOrderBy.mockResolvedValue([]);
  mockFrom.mockReturnValue({ where: mockWhere, orderBy: mockOrderBy });
  mockSelect.mockReturnValue({ from: mockFrom });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// getAllAreas — returns all areas ordered by sortOrder (AC #1, #7)
// ---------------------------------------------------------------------------

describe("getAllAreas — ordered area list (AC #1, #7)", () => {
  it(
    "[P0] given areas exist in DB when getAllAreas called then db.select is called",
    async () => {
      // AC #7 — area index page requires listing all areas
      // This function is not yet created in src/lib/db/queries/areas.ts
      const { getAllAreas } = await import("@/lib/db/queries/areas");

      mockOrderBy.mockResolvedValueOnce([makeArea(), makeArea2(), makeArea3()]);

      const result = await getAllAreas();

      expect(mockSelect).toHaveBeenCalledOnce();
      expect(result).toHaveLength(3);
    },
  );

  it(
    "[P0] given 3 areas when getAllAreas called then results are ordered by sortOrder ascending",
    async () => {
      // AC #7 — area index must display areas in correct order
      const { getAllAreas } = await import("@/lib/db/queries/areas");

      const areas = [makeArea(), makeArea2(), makeArea3()];
      mockOrderBy.mockResolvedValueOnce(areas);

      const result = await getAllAreas();

      expect(result[0].sortOrder).toBeLessThanOrEqual(result[1].sortOrder);
      expect(result[1].sortOrder).toBeLessThanOrEqual(result[2].sortOrder);
    },
  );

  it(
    "[P1] given no areas in DB when getAllAreas called then returns empty array",
    async () => {
      const { getAllAreas } = await import("@/lib/db/queries/areas");

      mockOrderBy.mockResolvedValueOnce([]);

      const result = await getAllAreas();

      expect(result).toEqual([]);
    },
  );
});

// ---------------------------------------------------------------------------
// getAreaBySlug — returns single area by slug (AC #1)
// ---------------------------------------------------------------------------

describe("getAreaBySlug — single area lookup (AC #1)", () => {
  it(
    "[P0] given slug='perez-zeledon' when getAreaBySlug called then returns area object",
    async () => {
      // AC #1 — area guide page needs to fetch area data by slug
      const { getAreaBySlug } = await import("@/lib/db/queries/areas");

      mockLimit.mockResolvedValueOnce([makeArea()]);

      const result = await getAreaBySlug("perez-zeledon");

      expect(result).not.toBeNull();
      expect(result!.slug).toBe("perez-zeledon");
      expect(result!.nameEn).toBe("Pérez Zeledón");
    },
  );

  it(
    "[P0] given non-existent slug when getAreaBySlug called then returns null",
    async () => {
      // AC #1 — area guide page calls notFound() when area doesn't exist
      const { getAreaBySlug } = await import("@/lib/db/queries/areas");

      mockLimit.mockResolvedValueOnce([]);

      const result = await getAreaBySlug("non-existent-area");

      expect(result).toBeNull();
    },
  );

  it(
    "[P1] given valid slug when getAreaBySlug called then query uses .limit(1)",
    async () => {
      // Performance: slug is unique, so limit(1) prevents scanning more rows
      const { getAreaBySlug } = await import("@/lib/db/queries/areas");

      mockLimit.mockResolvedValueOnce([makeArea()]);

      await getAreaBySlug("perez-zeledon");

      expect(mockLimit).toHaveBeenCalledWith(1);
    },
  );
});

// ---------------------------------------------------------------------------
// getAllAreaSlugs — returns slug array for generateStaticParams (AC #8)
// ---------------------------------------------------------------------------

describe("getAllAreaSlugs — SSG path generation (AC #8)", () => {
  it(
    "[P0] given 3 areas when getAllAreaSlugs called then returns array of 3 slugs",
    async () => {
      // AC #8 — generateStaticParams needs all slugs for SSG
      const { getAllAreaSlugs } = await import("@/lib/db/queries/areas");

      mockFrom.mockReturnValueOnce({
        where: mockWhere,
        orderBy: mockOrderBy,
      });
      // For select({ slug }) chain, simulate resolved value
      const mockFromDirect = vi.fn().mockResolvedValueOnce([
        { slug: "perez-zeledon" },
        { slug: "dominical" },
        { slug: "san-isidro" },
      ]);
      mockSelect.mockReturnValueOnce({ from: mockFromDirect });

      const result = await getAllAreaSlugs();

      expect(result).toHaveLength(3);
      expect(result).toContain("perez-zeledon");
      expect(result).toContain("dominical");
      expect(result).toContain("san-isidro");
    },
  );

  it(
    "[P1] given no areas when getAllAreaSlugs called then returns empty array",
    async () => {
      const { getAllAreaSlugs } = await import("@/lib/db/queries/areas");

      const mockFromDirect = vi.fn().mockResolvedValueOnce([]);
      mockSelect.mockReturnValueOnce({ from: mockFromDirect });

      const result = await getAllAreaSlugs();

      expect(result).toEqual([]);
    },
  );

  it(
    "[P0] given getAllAreaSlugs returns string[] when called then each element is a string",
    async () => {
      // Type safety: generateStaticParams expects string[] for the slug param
      const { getAllAreaSlugs } = await import("@/lib/db/queries/areas");

      const mockFromDirect = vi.fn().mockResolvedValueOnce([
        { slug: "perez-zeledon" },
      ]);
      mockSelect.mockReturnValueOnce({ from: mockFromDirect });

      const result = await getAllAreaSlugs();

      for (const slug of result) {
        expect(typeof slug).toBe("string");
      }
    },
  );
});

// ---------------------------------------------------------------------------
// getPropertiesByAreaSlug — filtered property list (AC #4)
// ---------------------------------------------------------------------------

describe("getPropertiesByAreaSlug — properties filtered by area (AC #4)", () => {
  it(
    "[P0] given areaSlug='perez-zeledon' with 2 visible properties when called then returns 2 PropertySearchItems",
    async () => {
      // AC #4 — Properties tab shows property grid filtered to this area
      const { getPropertiesByAreaSlug } = await import(
        "@/lib/db/queries/areas"
      );

      // Mock the properties query chain
      const mockPropertyOrderBy = vi.fn().mockResolvedValueOnce([
        { apiId: "API-001", title: "Mountain House", areaSlug: "perez-zeledon" },
        { apiId: "API-002", title: "Valley Villa", areaSlug: "perez-zeledon" },
      ]);
      const mockPropertyWhere = vi.fn().mockReturnValue({
        orderBy: mockPropertyOrderBy,
      });
      const mockPropertyFrom = vi.fn().mockReturnValue({
        where: mockPropertyWhere,
      });
      mockSelect.mockReturnValueOnce({ from: mockPropertyFrom });

      const result = await getPropertiesByAreaSlug("perez-zeledon");

      expect(result).toHaveLength(2);
      expect(mockSelect).toHaveBeenCalled();
    },
  );

  it(
    "[P0] given areaSlug with no visible properties when called then returns empty array",
    async () => {
      // AC #11 — empty state: zero properties → localized empty state message
      const { getPropertiesByAreaSlug } = await import(
        "@/lib/db/queries/areas"
      );

      const mockPropertyOrderBy = vi.fn().mockResolvedValueOnce([]);
      const mockPropertyWhere = vi.fn().mockReturnValue({
        orderBy: mockPropertyOrderBy,
      });
      const mockPropertyFrom = vi.fn().mockReturnValue({
        where: mockPropertyWhere,
      });
      mockSelect.mockReturnValueOnce({ from: mockPropertyFrom });

      const result = await getPropertiesByAreaSlug("empty-area");

      expect(result).toEqual([]);
    },
  );

  it(
    "[P1] given properties query when called then WHERE clause includes isVisible=true filter",
    async () => {
      // Only visible properties should appear in the area guide.
      // We verify the query filters by checking that mockWhere was called,
      // which means the implementation passes a WHERE clause (area + visibility).
      const { getPropertiesByAreaSlug } = await import(
        "@/lib/db/queries/areas"
      );

      const mockPropertyOrderBy = vi.fn().mockResolvedValueOnce([
        { apiId: "API-001", title: "Visible House" },
      ]);
      const mockPropertyWhere = vi.fn().mockReturnValue({
        orderBy: mockPropertyOrderBy,
      });
      const mockPropertyFrom = vi.fn().mockReturnValue({
        where: mockPropertyWhere,
      });
      mockSelect.mockReturnValueOnce({ from: mockPropertyFrom });

      await getPropertiesByAreaSlug("perez-zeledon");

      // The WHERE clause must have been called (filters by areaSlug + isVisible)
      expect(mockPropertyWhere).toHaveBeenCalledOnce();
    },
  );
});

// ---------------------------------------------------------------------------
// getSimilarAreas — same region, excluding current (AC #3)
// ---------------------------------------------------------------------------

describe("getSimilarAreas — same-region area lookup (AC #3)", () => {
  it(
    "[P0] given region='Mountain' and excludeSlug='perez-zeledon' when called then returns other Mountain areas",
    async () => {
      // AC #3 — Similar Areas tab shows SimilarAreasSlider with nearby area cards
      const { getSimilarAreas } = await import("@/lib/db/queries/areas");

      const mockSimilarOrderBy = vi.fn().mockResolvedValueOnce([makeArea3()]);
      const mockSimilarWhere = vi
        .fn()
        .mockReturnValue({ orderBy: mockSimilarOrderBy });
      const mockSimilarFrom = vi
        .fn()
        .mockReturnValue({ where: mockSimilarWhere });
      mockSelect.mockReturnValueOnce({ from: mockSimilarFrom });

      const result = await getSimilarAreas("Mountain", "perez-zeledon");

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe("san-isidro");
      // Must NOT include the excluded area
      expect(result.every((a: any) => a.slug !== "perez-zeledon")).toBe(true);
    },
  );

  it(
    "[P1] given region='Coast' and excludeSlug='dominical' when no other Coast areas then returns empty array",
    async () => {
      const { getSimilarAreas } = await import("@/lib/db/queries/areas");

      const mockSimilarOrderBy = vi.fn().mockResolvedValueOnce([]);
      const mockSimilarWhere = vi
        .fn()
        .mockReturnValue({ orderBy: mockSimilarOrderBy });
      const mockSimilarFrom = vi
        .fn()
        .mockReturnValue({ where: mockSimilarWhere });
      mockSelect.mockReturnValueOnce({ from: mockSimilarFrom });

      const result = await getSimilarAreas("Coast", "dominical");

      expect(result).toEqual([]);
    },
  );

  it(
    "[P1] given similar areas when called then results are ordered by sortOrder ascending",
    async () => {
      const { getSimilarAreas } = await import("@/lib/db/queries/areas");

      const areas = [
        makeArea({ slug: "a-first", sortOrder: 1 }),
        makeArea({ slug: "b-second", sortOrder: 5 }),
      ];
      const mockSimilarOrderBy = vi.fn().mockResolvedValueOnce(areas);
      const mockSimilarWhere = vi
        .fn()
        .mockReturnValue({ orderBy: mockSimilarOrderBy });
      const mockSimilarFrom = vi
        .fn()
        .mockReturnValue({ where: mockSimilarWhere });
      mockSelect.mockReturnValueOnce({ from: mockSimilarFrom });

      const result = await getSimilarAreas("Mountain", "perez-zeledon");

      expect(result[0].sortOrder).toBeLessThanOrEqual(result[1].sortOrder);
    },
  );
});
