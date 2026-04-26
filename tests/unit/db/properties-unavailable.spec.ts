/**
 * ATDD Red-Phase Scaffolds — Story 2.7: Sync Monitoring & Failure Resilience
 * Module: src/lib/db/queries/properties.ts (new query functions)
 *
 * Covers AC #3 — listing removed from API is hidden from search results (is_visible=false)
 *   but its URL still resolves to a "No longer available" page with similar properties.
 *
 * Tests:
 *   - getPropertyBySlug: returns soft-deleted properties WITHOUT filtering isVisible
 *   - getSimilarProperties: filters isVisible=true, orders by syncedAt DESC
 *
 * TDD RED PHASE: Tests are written against the expected contract.
 * They will fail (red) until getPropertyBySlug and getSimilarProperties are implemented.
 *
 * DB calls are mocked via vi.mock — no live DATABASE_URL required.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mock primitives — vi.hoisted() ensures these are available when the
// vi.mock() factory runs (which is hoisted to the top of the compiled output).
// ---------------------------------------------------------------------------

const { mockLimit, mockOrderBy, mockWhere, mockFrom, mockSelect } = vi.hoisted(() => {
  const mockLimit = vi.fn().mockResolvedValue([]);
  const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
  const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy, limit: mockLimit });
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
  return { mockLimit, mockOrderBy, mockWhere, mockFrom, mockSelect };
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
// Imports — resolved after mocks are hoisted
// ---------------------------------------------------------------------------

import { getPropertyBySlug, getSimilarProperties } from "@/lib/db/queries/properties";

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  // Re-wire the query chain after clearAllMocks resets return values
  mockLimit.mockResolvedValue([]);
  mockOrderBy.mockReturnValue({ limit: mockLimit });
  mockWhere.mockReturnValue({ orderBy: mockOrderBy, limit: mockLimit });
  mockFrom.mockReturnValue({ where: mockWhere });
  mockSelect.mockReturnValue({ from: mockFrom });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// AC #3 — getPropertyBySlug: returns soft-deleted properties (no isVisible filter)
// ---------------------------------------------------------------------------

describe("getPropertyBySlug — fetch property by slug including soft-deleted (AC #3)", () => {
  it.skip(
    "[P0] given a slug when getPropertyBySlug is called then db.select is called",
    async () => {
      // AC #3: Property page must receive the record even when is_visible=false
      await getPropertyBySlug("casa-en-perez-zeledon");

      expect(mockSelect).toHaveBeenCalledOnce();
    },
  );

  it.skip(
    "[P0] given slug='casa-en-perez-zeledon' and DB returns a soft-deleted property when getPropertyBySlug called then it returns the property with isVisible=false",
    async () => {
      // AC #3: The unavailable page MUST receive soft-deleted records (do NOT filter isVisible)
      // This is the critical invariant: getPropertyBySlug must NOT add WHERE is_visible=true
      const softDeletedProperty = {
        slug: "casa-en-perez-zeledon",
        isVisible: false,
        titleEn: "House in Pérez Zeledón",
        titleEs: "Casa en Pérez Zeledón",
        areaSlug: "perez-zeledon",
        priceUsd: 250000,
        propertyType: "residential",
        images: [],
        syncedAt: new Date("2026-04-01"),
      };
      mockLimit.mockResolvedValueOnce([softDeletedProperty]);

      const result = await getPropertyBySlug("casa-en-perez-zeledon");

      expect(result).not.toBeNull();
      expect(result?.isVisible).toBe(false);
    },
  );

  it.skip(
    "[P0] given slug='visible-property' and DB returns a visible property when getPropertyBySlug called then it returns the property with isVisible=true",
    async () => {
      // getPropertyBySlug returns all properties — the page component decides rendering
      const visibleProperty = {
        slug: "visible-property",
        isVisible: true,
        titleEn: "Ocean View Condo",
        titleEs: "Condominio con vista al mar",
        areaSlug: "jaco",
        priceUsd: 180000,
        propertyType: "condo",
        images: [],
        syncedAt: new Date("2026-04-20"),
      };
      mockLimit.mockResolvedValueOnce([visibleProperty]);

      const result = await getPropertyBySlug("visible-property");

      expect(result).not.toBeNull();
      expect(result?.isVisible).toBe(true);
    },
  );

  it.skip(
    "[P0] given slug='nonexistent-slug' and DB returns no rows when getPropertyBySlug called then it returns null",
    async () => {
      // AC #3: Property never existed → page calls notFound() (404), not unavailable UI
      mockLimit.mockResolvedValueOnce([]);

      const result = await getPropertyBySlug("nonexistent-slug");

      expect(result).toBeNull();
    },
  );

  it.skip(
    "[P1] given any slug when getPropertyBySlug called then query includes a .limit(1) call",
    async () => {
      // getPropertyBySlug returns at most 1 row (slug is unique)
      await getPropertyBySlug("any-slug");

      expect(mockLimit).toHaveBeenCalledWith(1);
    },
  );
});

// ---------------------------------------------------------------------------
// AC #3 — getSimilarProperties: filters isVisible=true, ordered by syncedAt DESC
// ---------------------------------------------------------------------------

describe("getSimilarProperties — fetch visible similar properties (AC #3)", () => {
  it.skip(
    "[P0] given areaSlug, excludeSlug when getSimilarProperties is called then db.select is called",
    async () => {
      // AC #3: Similar properties section on the unavailable page
      await getSimilarProperties("perez-zeledon", "casa-en-perez-zeledon");

      expect(mockSelect).toHaveBeenCalledOnce();
    },
  );

  it.skip(
    "[P0] given areaSlug='perez-zeledon' and excludeSlug when getSimilarProperties called then query includes .where() to filter isVisible=true",
    async () => {
      // AC #3: Similar properties must only show VISIBLE listings
      await getSimilarProperties("perez-zeledon", "excluded-slug");

      expect(mockWhere).toHaveBeenCalledOnce();
    },
  );

  it.skip(
    "[P0] given areaSlug='perez-zeledon' when getSimilarProperties called with 2 matching DB rows then it returns those 2 properties",
    async () => {
      // AC #3: Up to 3 properties with matching areaSlug and isVisible=true
      const similarProperties = [
        {
          slug: "similar-1",
          titleEn: "Farm in Pérez Zeledón",
          titleEs: "Finca en Pérez Zeledón",
          priceUsd: 300000,
          propertyType: "farm",
          images: [],
        },
        {
          slug: "similar-2",
          titleEn: "House in Pérez Zeledón",
          titleEs: "Casa en Pérez Zeledón",
          priceUsd: 200000,
          propertyType: "residential",
          images: [],
        },
      ];
      mockLimit.mockResolvedValueOnce(similarProperties);

      const result = await getSimilarProperties("perez-zeledon", "unavailable-property");

      expect(result).toHaveLength(2);
      expect(result[0].slug).toBe("similar-1");
    },
  );

  it.skip(
    "[P0] given areaSlug=null when getSimilarProperties called then query still runs (no areaSlug filter) and returns visible properties",
    async () => {
      // AC #3: Falls back to any visible property when areaSlug is null
      const anyVisibleProperty = [
        {
          slug: "any-visible",
          titleEn: "Property Without Area",
          titleEs: "Propiedad sin área",
          priceUsd: 150000,
          propertyType: "residential",
          images: [],
        },
      ];
      mockLimit.mockResolvedValueOnce(anyVisibleProperty);

      const result = await getSimilarProperties(null, "excluded-slug");

      expect(result).toHaveLength(1);
      expect(mockSelect).toHaveBeenCalledOnce();
    },
  );

  it.skip(
    "[P1] given areaSlug and excludeSlug when getSimilarProperties called then query includes .orderBy() (syncedAt DESC)",
    async () => {
      // AC #3: Most recently synced properties shown first (freshest data)
      await getSimilarProperties("san-jose", "some-slug");

      expect(mockOrderBy).toHaveBeenCalledOnce();
    },
  );

  it.skip(
    "[P1] given default limit when getSimilarProperties called without limit param then query limits to 3 results",
    async () => {
      // AC #3: Up to 3 similar properties — default limit=3 per story spec
      await getSimilarProperties("perez-zeledon", "excluded-slug");

      expect(mockLimit).toHaveBeenCalledWith(3);
    },
  );

  it.skip(
    "[P1] given custom limit=1 when getSimilarProperties called then query limits to 1 result",
    async () => {
      // getSimilarProperties accepts a configurable limit parameter
      await getSimilarProperties("perez-zeledon", "excluded-slug", 1);

      expect(mockLimit).toHaveBeenCalledWith(1);
    },
  );

  it.skip(
    "[P1] given no matching similar properties when getSimilarProperties called then it returns an empty array",
    async () => {
      // AC #3: 'Browse all properties' CTA shown when no similar properties found
      mockLimit.mockResolvedValueOnce([]);

      const result = await getSimilarProperties("remote-area", "excluded-slug");

      expect(result).toEqual([]);
    },
  );

  it.skip(
    "[P2] given getSimilarProperties resolves successfully then the function returns an array (not null/undefined)",
    async () => {
      // Caller depends on array result for .map() rendering in the page component
      const result = await getSimilarProperties("any-area", "any-slug");

      expect(Array.isArray(result)).toBe(true);
    },
  );
});
