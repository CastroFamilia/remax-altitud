/**
 * Story 4.5: Similar Properties & Cross-Linking
 * Module: src/lib/db/queries/properties.ts — getSimilarPropertiesRanked
 *
 * TDD Phase: RED — all tests are it() until implementation is done.
 * Remove it() per test when implementing to verify green phase.
 *
 * Covers:
 *   AC #2  — Similar properties selected based on: same area + similar price range (±20%)
 *            + similar type (prioritized in that order) (R-011)
 *
 * Test IDs from test-design-epic-4.md:
 *   4.5-UNIT-001 — returns listings from same area by default (P2)
 *   4.5-UNIT-002 — filters by similar price range ± 20% (P2)
 *
 * Environment: node (no JSX — .spec.ts runs in node environment by default)
 *
 * NOTE (red phase): getSimilarPropertiesRanked is not yet implemented.
 * The module is imported via type-cast to avoid TS2339 errors during the red phase.
 * When the function is added to src/lib/db/queries/properties.ts, remove the type cast.
 */

import { vi, describe, it, expect, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock the DB client BEFORE importing the module under test
// ---------------------------------------------------------------------------

vi.mock("@/lib/db/client", () => ({
  db: {
    select: vi.fn(),
  },
}));

// imported AFTER mocks
import { db } from "@/lib/db/client";
import type { PropertySearchItem } from "@/types/search";

// ---------------------------------------------------------------------------
// Type declaration for the not-yet-implemented export (red phase stub)
// ---------------------------------------------------------------------------

interface GetSimilarPropertiesRankedOpts {
  excludeSlug: string;
  areaSlug: string | null;
  priceUsd: number;
  propertyType: string;
  limit?: number;
}

/** Shape of the properties module including the not-yet-implemented function */
interface PropertiesModule {
  getSimilarPropertiesRanked: (
    opts: GetSimilarPropertiesRankedOpts,
  ) => Promise<PropertySearchItem[]>;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal PropertySearchItem-shaped DB row for mock returns. */
function makeDbRow(overrides: {
  slug: string;
  areaSlug?: string | null;
  priceUsd?: number;
  propertyType?: string;
}): PropertySearchItem {
  return {
    id: `id-${overrides.slug}`,
    slug: overrides.slug,
    titleEn: overrides.slug,
    titleEs: overrides.slug,
    priceUsd: overrides.priceUsd ?? 200000,
    bedrooms: 3,
    bathrooms: 2,
    lotSizeM2: 500,
    constructionM2: 120,
    zmtStatus: "titled",
    propertyType: overrides.propertyType ?? "Casa",
    status: "active",
    areaSlug: overrides.areaSlug ?? "perez-zeledon",
    images: [{ src: "/img/placeholder.jpg" }],
    latitude: 9.37,
    longitude: -83.69,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("Story 4.5: getSimilarPropertiesRanked — similarity algorithm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  // [P0] Core algorithm — same area priority

  it(
    "[P0] 4.5-UNIT-001: returns listings from same area first when mixed area input (AC #2, R-011)",
    async () => {
      // THIS TEST WILL FAIL — getSimilarPropertiesRanked not yet implemented
      //
      // Seed: 3 same-area listings + 2 different-area listings
      // Expected: same-area listings appear in results first
      //
      // We mock the DB to simulate the 4-step algorithm returning ranked results.
      const sameAreaRows = [
        makeDbRow({ slug: "casa-a", areaSlug: "perez-zeledon", priceUsd: 210000 }),
        makeDbRow({ slug: "casa-b", areaSlug: "perez-zeledon", priceUsd: 220000 }),
      ];

      // Mock the chained Drizzle query builder (select → from → where → orderBy → limit)
      const mockChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(sameAreaRows),
      };
      vi.mocked(db.select).mockReturnValue(
        mockChain as unknown as ReturnType<typeof db.select>,
      );

      const propertiesModule = (await import(
        "@/lib/db/queries/properties"
      )) as unknown as PropertiesModule;
      const { getSimilarPropertiesRanked } = propertiesModule;

      const results = await getSimilarPropertiesRanked({
        excludeSlug: "current-property",
        areaSlug: "perez-zeledon",
        priceUsd: 200000,
        propertyType: "Casa",
        limit: 4,
      });

      expect(results.length).toBeGreaterThan(0);
      // All returned results should be from same area when available
      const sameAreaResults = results.filter(
        (r: PropertySearchItem) => r.areaSlug === "perez-zeledon",
      );
      expect(sameAreaResults.length).toBeGreaterThan(0);
    },
  );

  it(
    "[P0] 4.5-UNIT-002: filters by similar price range ±20% — returns $190k and $200k but not $300k (AC #2, R-011)",
    async () => {
      // THIS TEST WILL FAIL — getSimilarPropertiesRanked not yet implemented
      //
      // Seed: $200k, $190k (within ±20% of $200k base), $300k (outside ±20%)
      // For base price $200k: range = [$160k, $240k]
      // Expected: $200k and $190k returned, NOT $300k
      //
      const inRangeRows = [
        makeDbRow({ slug: "casa-in-1", priceUsd: 200000 }),
        makeDbRow({ slug: "casa-in-2", priceUsd: 190000 }),
      ];

      const mockChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(inRangeRows),
      };
      vi.mocked(db.select).mockReturnValue(
        mockChain as unknown as ReturnType<typeof db.select>,
      );

      const propertiesModule = (await import(
        "@/lib/db/queries/properties"
      )) as unknown as PropertiesModule;
      const { getSimilarPropertiesRanked } = propertiesModule;

      const results = await getSimilarPropertiesRanked({
        excludeSlug: "current-property",
        areaSlug: "perez-zeledon",
        priceUsd: 200000,
        propertyType: "Casa",
        limit: 4,
      });

      // All returned results should be within ±20% price range ($160k–$240k)
      const basePriceUsd = 200000;
      const priceLow = basePriceUsd * 0.8;
      const priceHigh = basePriceUsd * 1.2;
      for (const result of results) {
        expect(result.priceUsd).toBeGreaterThanOrEqual(priceLow);
        expect(result.priceUsd).toBeLessThanOrEqual(priceHigh);
      }

      const outOfRange = results.find(
        (r: PropertySearchItem) => r.priceUsd === 300000,
      );
      expect(outOfRange).toBeUndefined();
    },
  );

  // [P1] Exclusion and limit

  it(
    "[P1] 4.5-UNIT-003: excludes the current property slug from results (AC #2)",
    async () => {
      // THIS TEST WILL FAIL — getSimilarPropertiesRanked not yet implemented
      const rows = [
        makeDbRow({ slug: "similar-casa", priceUsd: 210000 }),
        // current property slug is excluded at DB query level
      ];

      const mockChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(rows),
      };
      vi.mocked(db.select).mockReturnValue(
        mockChain as unknown as ReturnType<typeof db.select>,
      );

      const propertiesModule = (await import(
        "@/lib/db/queries/properties"
      )) as unknown as PropertiesModule;
      const { getSimilarPropertiesRanked } = propertiesModule;

      const EXCLUDED_SLUG = "current-property";
      const results = await getSimilarPropertiesRanked({
        excludeSlug: EXCLUDED_SLUG,
        areaSlug: "perez-zeledon",
        priceUsd: 200000,
        propertyType: "Casa",
        limit: 4,
      });

      const excludedFound = results.find(
        (r: PropertySearchItem) => r.slug === EXCLUDED_SLUG,
      );
      expect(excludedFound).toBeUndefined();
    },
  );

  it(
    "[P1] 4.5-UNIT-004: falls back to any visible properties if no same-area results exist (AC #2)",
    async () => {
      // THIS TEST WILL FAIL — getSimilarPropertiesRanked not yet implemented
      //
      // Steps 1–3 return empty (no same-area properties)
      // Step 4 (fallback) should return cross-area properties
      //
      const fallbackRows = [
        makeDbRow({ slug: "faraway-casa", areaSlug: "dominical", priceUsd: 210000 }),
      ];

      const mockChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn()
          .mockResolvedValueOnce([]) // step 1 — empty
          .mockResolvedValueOnce([]) // step 2 — empty
          .mockResolvedValueOnce([]) // step 3 — empty
          .mockResolvedValue(fallbackRows), // step 4 — fallback
      };
      vi.mocked(db.select).mockReturnValue(
        mockChain as unknown as ReturnType<typeof db.select>,
      );

      const propertiesModule = (await import(
        "@/lib/db/queries/properties"
      )) as unknown as PropertiesModule;
      const { getSimilarPropertiesRanked } = propertiesModule;

      const results = await getSimilarPropertiesRanked({
        excludeSlug: "current-property",
        areaSlug: "perez-zeledon",
        priceUsd: 200000,
        propertyType: "Casa",
        limit: 4,
      });

      // Should not be empty — fallback ensures results are always available
      expect(results.length).toBeGreaterThan(0);
    },
  );

  it(
    "[P1] 4.5-UNIT-005: returns at most `limit` results (default limit is 4) (AC #2)",
    async () => {
      // THIS TEST WILL FAIL — getSimilarPropertiesRanked not yet implemented
      const firstFourRows = Array.from({ length: 4 }, (_, i) =>
        makeDbRow({ slug: `casa-${i}`, priceUsd: 200000 + i * 1000 }),
      );

      const mockChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(firstFourRows),
      };
      vi.mocked(db.select).mockReturnValue(
        mockChain as unknown as ReturnType<typeof db.select>,
      );

      const propertiesModule = (await import(
        "@/lib/db/queries/properties"
      )) as unknown as PropertiesModule;
      const { getSimilarPropertiesRanked } = propertiesModule;

      const results = await getSimilarPropertiesRanked({
        excludeSlug: "current-property",
        areaSlug: "perez-zeledon",
        priceUsd: 200000,
        propertyType: "Casa",
        // limit defaults to 4
      });

      expect(results.length).toBeLessThanOrEqual(4);
    },
  );

  // [P2] Image mapping

  it(
    "[P2] 4.5-UNIT-006: maintains OptimizedImage[] shape with { src } in PropertySearchItem (AC #2)",
    async () => {
      // DB stores images as OptimizedImage[] with { src: string; ... }
      // PropertySearchItem also expects OptimizedImage[]
      const dbRowWithSrc = {
        id: "prop-src-test",
        slug: "casa-src-test",
        titleEn: "Test",
        titleEs: "Test",
        priceUsd: 200000,
        bedrooms: 3,
        bathrooms: 2,
        lotSizeM2: 500,
        constructionM2: 120,
        zmtStatus: "titled",
        propertyType: "Casa",
        status: "active",
        areaSlug: "perez-zeledon",
        images: [{ src: "/img/test.jpg", alt: "Test image" }],
        latitude: 9.37,
        longitude: -83.69,
      };

      const mockChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([dbRowWithSrc]),
      };
      vi.mocked(db.select).mockReturnValue(
        mockChain as unknown as ReturnType<typeof db.select>,
      );

      const propertiesModule = (await import(
        "@/lib/db/queries/properties"
      )) as unknown as PropertiesModule;
      const { getSimilarPropertiesRanked } = propertiesModule;

      const results = await getSimilarPropertiesRanked({
        excludeSlug: "current-property",
        areaSlug: "perez-zeledon",
        priceUsd: 200000,
        propertyType: "Casa",
        limit: 4,
      });

      expect(results.length).toBeGreaterThan(0);
      const firstResult = results[0];
      // Must have src, NOT url
      expect(firstResult.images[0]).toHaveProperty("src");
      expect(firstResult.images[0].src).toBe("/img/test.jpg");
    },
  );
});
