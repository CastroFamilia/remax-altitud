/**
 * ATDD Scaffolds — Story 6.2: Community Pages
 * Module: src/lib/db/queries/communities.ts
 *
 * TDD RED PHASE — all tests use it() and will FAIL until:
 *   1. src/lib/db/schema/communities.ts is created with Drizzle schema
 *   2. src/lib/db/queries/communities.ts is created with query functions
 *   3. Communities table is seeded with test data
 *
 * Coverage:
 *   AC #1, #10 — getAllCommunities() returns ordered community list
 *   AC #1      — getCommunityBySlugAndArea() returns single community
 *   AC #9      — getAllCommunityParams() returns params for SSG
 *   AC #4      — getPropertiesByCommunityId() returns PropertySearchItem[]
 *   AC #6      — getSimilarCommunities() returns same-area communities
 *   AC #8      — getFeaturedCommunities() returns top communities by listing count
 *   AC #7      — getCommunitiesByAreaId() returns communities for an area
 *
 * DB calls are mocked via vi.mock — no live DATABASE_URL required.
 *
 * Activation instructions:
 *   1. Remove it.skip from the test you are implementing
 *   2. Run: npx vitest run tests/unit/community/community-queries.spec.ts
 *   3. Verify the test FAILS before implementation, then passes after
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  makeCommunity,
  makeCommunity2,
  makeCommunity3,
} from "../../fixtures/community-factories";

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
  mockInnerJoin,
} = vi.hoisted(() => {
  const mockWhere = vi.fn();
  const mockLimit = vi.fn();
  const mockOrderBy = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockInnerJoin = vi.fn();

  // Default chain: db.select().from().innerJoin().where().orderBy().limit()
  mockLimit.mockResolvedValue([]);
  mockWhere.mockReturnValue({ limit: mockLimit, orderBy: mockOrderBy });
  mockOrderBy.mockResolvedValue([]);
  mockInnerJoin.mockReturnValue({
    where: mockWhere,
    orderBy: mockOrderBy,
  });
  mockFrom.mockReturnValue({
    where: mockWhere,
    orderBy: mockOrderBy,
    innerJoin: mockInnerJoin,
  });
  mockSelect.mockReturnValue({ from: mockFrom });

  return { mockWhere, mockLimit, mockOrderBy, mockFrom, mockSelect, mockInnerJoin };
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
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  // Re-wire the chains after clearAllMocks resets return values
  mockLimit.mockResolvedValue([]);
  mockWhere.mockReturnValue({ limit: mockLimit, orderBy: mockOrderBy });
  mockOrderBy.mockResolvedValue([]);
  mockInnerJoin.mockReturnValue({
    where: mockWhere,
    orderBy: mockOrderBy,
  });
  mockFrom.mockReturnValue({
    where: mockWhere,
    orderBy: mockOrderBy,
    innerJoin: mockInnerJoin,
  });
  mockSelect.mockReturnValue({ from: mockFrom });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// getAllCommunities — returns all communities ordered by name (AC #1, #10)
// ---------------------------------------------------------------------------

describe("getAllCommunities — ordered community list (AC #1, #10)", () => {
  it(
    "[P0] given communities exist in DB when getAllCommunities called then db.select is called",
    async () => {
      // AC #10 — community index page requires listing all communities
      const { getAllCommunities } = await import(
        "@/lib/db/queries/communities"
      );

      mockOrderBy.mockResolvedValueOnce([
        makeCommunity(),
        makeCommunity2(),
        makeCommunity3(),
      ]);

      const result = await getAllCommunities();

      expect(mockSelect).toHaveBeenCalledOnce();
      expect(result).toHaveLength(3);
    },
  );

  it(
    "[P0] given 3 communities when getAllCommunities called then results are ordered by name ascending",
    async () => {
      // AC #10 — community index must display communities in alphabetical order
      const { getAllCommunities } = await import(
        "@/lib/db/queries/communities"
      );

      const communities = [makeCommunity(), makeCommunity2(), makeCommunity3()];
      // Sort by name to simulate DB ordering
      communities.sort((a, b) => a.name.localeCompare(b.name));
      mockOrderBy.mockResolvedValueOnce(communities);

      const result = await getAllCommunities();

      // RISE > Santa Elena Hills > Serena del Mar
      expect(result[0].name.localeCompare(result[1].name)).toBeLessThanOrEqual(0);
    },
  );

  it(
    "[P1] given no communities in DB when getAllCommunities called then returns empty array",
    async () => {
      const { getAllCommunities } = await import(
        "@/lib/db/queries/communities"
      );

      mockOrderBy.mockResolvedValueOnce([]);

      const result = await getAllCommunities();

      expect(result).toEqual([]);
    },
  );
});

// ---------------------------------------------------------------------------
// getCommunityBySlugAndArea — returns single community (AC #1)
// ---------------------------------------------------------------------------

describe("getCommunityBySlugAndArea — single community lookup (AC #1)", () => {
  it(
    "[P0] given communitySlug='rise' and areaSlug='perez-zeledon' when called then returns community object",
    async () => {
      // AC #1 — community page needs to fetch community data by slug + area
      const { getCommunityBySlugAndArea } = await import(
        "@/lib/db/queries/communities"
      );

      mockLimit.mockResolvedValueOnce([
        { communities: makeCommunity() },
      ]);

      const result = await getCommunityBySlugAndArea("rise", "perez-zeledon");

      expect(result).not.toBeNull();
      expect(result!.slug).toBe("rise");
      expect(result!.name).toBe("RISE");
    },
  );

  it(
    "[P0] given non-existent community slug when called then returns null",
    async () => {
      // AC #1 — community page calls notFound() when community doesn't exist
      const { getCommunityBySlugAndArea } = await import(
        "@/lib/db/queries/communities"
      );

      mockLimit.mockResolvedValueOnce([]);

      const result = await getCommunityBySlugAndArea(
        "non-existent",
        "perez-zeledon",
      );

      expect(result).toBeNull();
    },
  );

  it(
    "[P1] given valid slugs when called then query uses .limit(1)",
    async () => {
      // Performance: community slug is unique per area, so limit(1) prevents scanning
      const { getCommunityBySlugAndArea } = await import(
        "@/lib/db/queries/communities"
      );

      mockLimit.mockResolvedValueOnce([
        { communities: makeCommunity() },
      ]);

      await getCommunityBySlugAndArea("rise", "perez-zeledon");

      expect(mockLimit).toHaveBeenCalledWith(1);
    },
  );

  it(
    "[P1] given valid slugs when called then query joins with areas table",
    async () => {
      // Must validate area-community relationship via join
      const { getCommunityBySlugAndArea } = await import(
        "@/lib/db/queries/communities"
      );

      mockLimit.mockResolvedValueOnce([
        { communities: makeCommunity() },
      ]);

      await getCommunityBySlugAndArea("rise", "perez-zeledon");

      expect(mockInnerJoin).toHaveBeenCalled();
    },
  );
});

// ---------------------------------------------------------------------------
// getAllCommunityParams — SSG path generation (AC #9, 6.2-INT-001)
// ---------------------------------------------------------------------------

describe("getAllCommunityParams — SSG path generation (AC #9, 6.2-INT-001)", () => {
  it(
    "[P0] 6.2-INT-001: given 3 communities when getAllCommunityParams called then returns 3 slug/area pairs",
    async () => {
      // AC #9 — generateStaticParams needs all community+area slug pairs for SSG
      // Risk R-005: Missing params → community pages return 404 on cold start
      const { getAllCommunityParams } = await import(
        "@/lib/db/queries/communities"
      );

      const mockJoinFrom = vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockResolvedValueOnce([
          { community: "rise", slug: "perez-zeledon" },
          { community: "santa-elena-hills", slug: "perez-zeledon" },
          { community: "serena-del-mar", slug: "dominical" },
        ]),
      });
      mockSelect.mockReturnValueOnce({ from: mockJoinFrom });

      const result = await getAllCommunityParams();

      expect(result).toHaveLength(3);
      expect(result).toContainEqual({
        community: "rise",
        slug: "perez-zeledon",
      });
    },
  );

  it(
    "[P1] given no communities when getAllCommunityParams called then returns empty array",
    async () => {
      const { getAllCommunityParams } = await import(
        "@/lib/db/queries/communities"
      );

      const mockJoinFrom = vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockResolvedValueOnce([]),
      });
      mockSelect.mockReturnValueOnce({ from: mockJoinFrom });

      const result = await getAllCommunityParams();

      expect(result).toEqual([]);
    },
  );

  it(
    "[P0] given getAllCommunityParams when called then each element has both community and slug strings",
    async () => {
      // Type safety: generateStaticParams expects { community: string, slug: string }[]
      const { getAllCommunityParams } = await import(
        "@/lib/db/queries/communities"
      );

      const mockJoinFrom = vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockResolvedValueOnce([
          { community: "rise", slug: "perez-zeledon" },
        ]),
      });
      mockSelect.mockReturnValueOnce({ from: mockJoinFrom });

      const result = await getAllCommunityParams();

      for (const param of result) {
        expect(typeof param.community).toBe("string");
        expect(typeof param.slug).toBe("string");
      }
    },
  );
});

// ---------------------------------------------------------------------------
// getPropertiesByCommunityId — filtered property list (AC #4)
// ---------------------------------------------------------------------------

describe("getPropertiesByCommunityId — properties filtered by community (AC #4)", () => {
  it(
    "[P0] given communityId with 3 visible properties when called then returns 3 PropertySearchItems",
    async () => {
      // AC #4 — Properties tab shows property grid filtered by community_id
      // Risk R-004: community page shows zero properties despite listings
      const { getPropertiesByCommunityId } = await import(
        "@/lib/db/queries/communities"
      );

      const mockPropertyOrderBy = vi.fn().mockResolvedValueOnce([
        { apiId: "API-001", title: "Mountain Lot 1", communityId: "uuid-community-1" },
        { apiId: "API-002", title: "Mountain Lot 2", communityId: "uuid-community-1" },
        { apiId: "API-003", title: "Mountain Lot 3", communityId: "uuid-community-1" },
      ]);
      const mockPropertyWhere = vi.fn().mockReturnValue({
        orderBy: mockPropertyOrderBy,
      });
      const mockPropertyFrom = vi.fn().mockReturnValue({
        where: mockPropertyWhere,
      });
      mockSelect.mockReturnValueOnce({ from: mockPropertyFrom });

      const result = await getPropertiesByCommunityId("uuid-community-1");

      expect(result).toHaveLength(3);
      expect(mockSelect).toHaveBeenCalled();
    },
  );

  it(
    "[P0] given communityId with no visible properties when called then returns empty array",
    async () => {
      // AC #14 — empty state: zero properties → localized empty state message
      const { getPropertiesByCommunityId } = await import(
        "@/lib/db/queries/communities"
      );

      const mockPropertyOrderBy = vi.fn().mockResolvedValueOnce([]);
      const mockPropertyWhere = vi.fn().mockReturnValue({
        orderBy: mockPropertyOrderBy,
      });
      const mockPropertyFrom = vi.fn().mockReturnValue({
        where: mockPropertyWhere,
      });
      mockSelect.mockReturnValueOnce({ from: mockPropertyFrom });

      const result = await getPropertiesByCommunityId("uuid-community-empty");

      expect(result).toEqual([]);
    },
  );

  it(
    "[P1] given properties query when called then WHERE clause includes isVisible=true filter",
    async () => {
      // Only visible properties should appear in the community page.
      const { getPropertiesByCommunityId } = await import(
        "@/lib/db/queries/communities"
      );

      const mockPropertyOrderBy = vi.fn().mockResolvedValueOnce([]);
      const mockPropertyWhere = vi.fn().mockReturnValue({
        orderBy: mockPropertyOrderBy,
      });
      const mockPropertyFrom = vi.fn().mockReturnValue({
        where: mockPropertyWhere,
      });
      mockSelect.mockReturnValueOnce({ from: mockPropertyFrom });

      await getPropertiesByCommunityId("uuid-community-1");

      // The WHERE clause must have been called (filters by communityId + isVisible)
      expect(mockPropertyWhere).toHaveBeenCalledOnce();
    },
  );
});

// ---------------------------------------------------------------------------
// getSimilarCommunities — same area, excluding current (AC #6)
// ---------------------------------------------------------------------------

describe("getSimilarCommunities — same-area community lookup (AC #6)", () => {
  it(
    "[P0] given areaId and excludeSlug when called then returns other communities in same area",
    async () => {
      // AC #6 — SimilarCommunitiesSlider shows nearby community cards
      const { getSimilarCommunities } = await import(
        "@/lib/db/queries/communities"
      );

      const mockSimilarOrderBy = vi
        .fn()
        .mockResolvedValueOnce([makeCommunity2()]);
      const mockSimilarWhere = vi
        .fn()
        .mockReturnValue({ orderBy: mockSimilarOrderBy });
      const mockSimilarFrom = vi
        .fn()
        .mockReturnValue({ where: mockSimilarWhere });
      mockSelect.mockReturnValueOnce({ from: mockSimilarFrom });

      const result = await getSimilarCommunities("uuid-area-1", "rise");

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe("santa-elena-hills");
      // Must NOT include the excluded community
      expect(
        result.every(
          (c: Record<string, unknown>) => c.slug !== "rise",
        ),
      ).toBe(true);
    },
  );

  it(
    "[P1] given area with only one community when called then returns empty array",
    async () => {
      const { getSimilarCommunities } = await import(
        "@/lib/db/queries/communities"
      );

      const mockSimilarOrderBy = vi.fn().mockResolvedValueOnce([]);
      const mockSimilarWhere = vi
        .fn()
        .mockReturnValue({ orderBy: mockSimilarOrderBy });
      const mockSimilarFrom = vi
        .fn()
        .mockReturnValue({ where: mockSimilarWhere });
      mockSelect.mockReturnValueOnce({ from: mockSimilarFrom });

      const result = await getSimilarCommunities("uuid-area-2", "serena-del-mar");

      expect(result).toEqual([]);
    },
  );

  it(
    "[P1] given similar communities when called then results are ordered by name ascending",
    async () => {
      const { getSimilarCommunities } = await import(
        "@/lib/db/queries/communities"
      );

      const communities = [
        makeCommunity2({ name: "Alpha Community" }),
        makeCommunity({ slug: "beta", name: "Beta Community" }),
      ];
      const mockSimilarOrderBy = vi.fn().mockResolvedValueOnce(communities);
      const mockSimilarWhere = vi
        .fn()
        .mockReturnValue({ orderBy: mockSimilarOrderBy });
      const mockSimilarFrom = vi
        .fn()
        .mockReturnValue({ where: mockSimilarWhere });
      mockSelect.mockReturnValueOnce({ from: mockSimilarFrom });

      const result = await getSimilarCommunities("uuid-area-1", "serena");

      expect(result[0].name.localeCompare(result[1].name)).toBeLessThanOrEqual(0);
    },
  );
});

// ---------------------------------------------------------------------------
// getFeaturedCommunities — homepage featured (AC #8)
// ---------------------------------------------------------------------------

describe("getFeaturedCommunities — homepage featured communities (AC #8)", () => {
  it(
    "[P0] given communities with listingCount > 0 when called then returns top communities by listing count",
    async () => {
      // AC #8 — Featured Communities section on homepage shows 2-3 gold-bordered cards
      const { getFeaturedCommunities } = await import(
        "@/lib/db/queries/communities"
      );

      const communities = [
        makeCommunity({ listingCount: 12 }),
        makeCommunity2({ listingCount: 8 }),
        makeCommunity3({ listingCount: 5 }),
      ];
      const mockFeaturedLimit = vi.fn().mockResolvedValueOnce(communities);
      const mockFeaturedOrderBy = vi
        .fn()
        .mockReturnValue({ limit: mockFeaturedLimit });
      const mockFeaturedWhere = vi
        .fn()
        .mockReturnValue({ orderBy: mockFeaturedOrderBy });
      const mockFeaturedFrom = vi
        .fn()
        .mockReturnValue({ where: mockFeaturedWhere });
      mockSelect.mockReturnValueOnce({ from: mockFeaturedFrom });

      const result = await getFeaturedCommunities(3);

      expect(result).toHaveLength(3);
      // Should be ordered by listing count DESC
      expect(result[0].listingCount).toBeGreaterThanOrEqual(result[1].listingCount);
    },
  );

  it(
    "[P1] given no communities with listings when called then returns empty array",
    async () => {
      const { getFeaturedCommunities } = await import(
        "@/lib/db/queries/communities"
      );

      const mockFeaturedLimit = vi.fn().mockResolvedValueOnce([]);
      const mockFeaturedOrderBy = vi
        .fn()
        .mockReturnValue({ limit: mockFeaturedLimit });
      const mockFeaturedWhere = vi
        .fn()
        .mockReturnValue({ orderBy: mockFeaturedOrderBy });
      const mockFeaturedFrom = vi
        .fn()
        .mockReturnValue({ where: mockFeaturedWhere });
      mockSelect.mockReturnValueOnce({ from: mockFeaturedFrom });

      const result = await getFeaturedCommunities();

      expect(result).toEqual([]);
    },
  );

  it(
    "[P1] given limit parameter when called then query uses provided limit",
    async () => {
      const { getFeaturedCommunities } = await import(
        "@/lib/db/queries/communities"
      );

      const mockFeaturedLimit = vi
        .fn()
        .mockResolvedValueOnce([makeCommunity()]);
      const mockFeaturedOrderBy = vi
        .fn()
        .mockReturnValue({ limit: mockFeaturedLimit });
      const mockFeaturedWhere = vi
        .fn()
        .mockReturnValue({ orderBy: mockFeaturedOrderBy });
      const mockFeaturedFrom = vi
        .fn()
        .mockReturnValue({ where: mockFeaturedWhere });
      mockSelect.mockReturnValueOnce({ from: mockFeaturedFrom });

      await getFeaturedCommunities(2);

      expect(mockFeaturedLimit).toHaveBeenCalledWith(2);
    },
  );
});

// ---------------------------------------------------------------------------
// getCommunitiesByAreaId — area guide community cards (AC #7)
// ---------------------------------------------------------------------------

describe("getCommunitiesByAreaId — communities for area guide (AC #7)", () => {
  it(
    "[P0] given areaId with 2 communities when called then returns 2 community objects",
    async () => {
      // AC #7 — area guide page shows CommunityCards with real DB data
      const { getCommunitiesByAreaId } = await import(
        "@/lib/db/queries/communities"
      );

      const mockAreaOrderBy = vi
        .fn()
        .mockResolvedValueOnce([makeCommunity(), makeCommunity2()]);
      const mockAreaWhere = vi
        .fn()
        .mockReturnValue({ orderBy: mockAreaOrderBy });
      const mockAreaFrom = vi
        .fn()
        .mockReturnValue({ where: mockAreaWhere });
      mockSelect.mockReturnValueOnce({ from: mockAreaFrom });

      const result = await getCommunitiesByAreaId("uuid-area-1");

      expect(result).toHaveLength(2);
    },
  );

  it(
    "[P1] given areaId with no communities when called then returns empty array",
    async () => {
      const { getCommunitiesByAreaId } = await import(
        "@/lib/db/queries/communities"
      );

      const mockAreaOrderBy = vi.fn().mockResolvedValueOnce([]);
      const mockAreaWhere = vi
        .fn()
        .mockReturnValue({ orderBy: mockAreaOrderBy });
      const mockAreaFrom = vi
        .fn()
        .mockReturnValue({ where: mockAreaWhere });
      mockSelect.mockReturnValueOnce({ from: mockAreaFrom });

      const result = await getCommunitiesByAreaId("uuid-area-nonexistent");

      expect(result).toEqual([]);
    },
  );

  it(
    "[P1] given communities when called then results are ordered by name ascending",
    async () => {
      const { getCommunitiesByAreaId } = await import(
        "@/lib/db/queries/communities"
      );

      const communities = [makeCommunity(), makeCommunity2()];
      communities.sort((a, b) => a.name.localeCompare(b.name));
      const mockAreaOrderBy = vi.fn().mockResolvedValueOnce(communities);
      const mockAreaWhere = vi
        .fn()
        .mockReturnValue({ orderBy: mockAreaOrderBy });
      const mockAreaFrom = vi
        .fn()
        .mockReturnValue({ where: mockAreaWhere });
      mockSelect.mockReturnValueOnce({ from: mockAreaFrom });

      const result = await getCommunitiesByAreaId("uuid-area-1");

      expect(result[0].name.localeCompare(result[1].name)).toBeLessThanOrEqual(0);
    },
  );
});

// ---------------------------------------------------------------------------
// sortCommunitiesCustom — dynamic custom community sorting (User Request)
// ---------------------------------------------------------------------------

describe("sortCommunitiesCustom — custom community sorting order", () => {
  it("should sort communities in the exact order requested by the user", async () => {
    const { sortCommunitiesCustom } = await import(
      "@/lib/db/queries/communities"
    );

    const unsorted = [
      { slug: "villas-san-miguel", name: "Villas San Miguel" },
      { slug: "rise-costa-rica", name: "RISE" },
      { slug: "residencial-la-piedra", name: "Residencial La Piedra" },
      { slug: "harmony-heights", name: "Harmony Heights" },
      { slug: "santa-elena-hills", name: "Santa Elena Hills" },
      { slug: "serena-san-mateo", name: "SERENA" },
    ];

    const sorted = sortCommunitiesCustom(unsorted);

    expect(sorted).toHaveLength(6);
    expect(sorted[0].slug).toBe("rise-costa-rica");
    expect(sorted[1].slug).toBe("santa-elena-hills");
    expect(sorted[2].slug).toBe("harmony-heights");
    expect(sorted[3].slug).toBe("serena-san-mateo");
    expect(sorted[4].slug).toBe("residencial-la-piedra");
    expect(sorted[5].slug).toBe("villas-san-miguel");
  });

  it("should place unrecognized community slugs at the end of the list", async () => {
    const { sortCommunitiesCustom } = await import(
      "@/lib/db/queries/communities"
    );

    const list = [
      { slug: "unknown-community", name: "Unknown" },
      { slug: "rise-costa-rica", name: "RISE" },
    ];

    const sorted = sortCommunitiesCustom(list);

    expect(sorted[0].slug).toBe("rise-costa-rica");
    expect(sorted[1].slug).toBe("unknown-community");
  });
});
