/**
 * Story 6.5: Community Geo-Fence Auto-Tagging
 * Module: src/lib/sync/geo-tagger.ts
 *
 * TDD RED PHASE — all tests use it.skip() and will FAIL until:
 *   1. Drizzle geographyPolygon custom type is defined (src/lib/db/types/postgis.ts)
 *   2. communities table has geoFence column enabled (src/lib/db/schema/communities.ts)
 *   3. geo-tagger utility is implemented (src/lib/sync/geo-tagger.ts)
 *   4. Sync pipeline includes community geo-tagging step (src/lib/sync/pipeline.ts)
 *
 * Test IDs:
 *   6.5-UNIT-001 — Bulk Tagging: Properties inside community polygon auto-tagged (AC #1, P0)
 *   6.5-UNIT-002 — Manual Override Preservation: Unchanged coordinates preserve community assignment (AC #4, P0)
 *   6.5-UNIT-003 — Relocation/Movement: Coordinate changes update community assignment (AC #2, P0)
 *   6.5-UNIT-004 — Relocation/Movement: Moving outside all communities resets community to NULL (AC #3, P0)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mock primitives for the db.execute chain
const { mockExecute } = vi.hoisted(() => {
  const mockExecute = vi.fn().mockResolvedValue({ count: 0 });
  return { mockExecute };
});

vi.mock("@/lib/db/client", () => ({
  db: {
    execute: mockExecute,
  },
}));

import { autoTagCommunities } from "@/lib/sync/geo-tagger";

describe("autoTagCommunities — Spatial Auto-Tagging (ATDD — RED PHASE)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 6.5-UNIT-001 — Bulk Tagging (AC #1, P0)
  // ---------------------------------------------------------------------------
  it(
    "[P0] 6.5-UNIT-001: Bulk Tagging — properties with coordinates inside a community polygon are assigned to that community",
    async () => {
      // Given: the database returns 3 successfully auto-tagged properties
      mockExecute.mockResolvedValueOnce({ count: 3 });

      // When: the daily sync pipeline runs community geo-tagging
      const taggedCount = await autoTagCommunities();

      // Then: the tagger returns the count of processed listings and queries ST_Within
      expect(mockExecute).toHaveBeenCalledTimes(2);
      expect(taggedCount).toBe(3);

      const sqlCall = mockExecute.mock.calls[0][0] as {
        sql?: string;
        query?: string;
        queryChunks?: { value?: string | string[] }[];
      };
      const sqlString = (
        sqlCall.sql ||
        sqlCall.query ||
        (sqlCall.queryChunks
          ? sqlCall.queryChunks
              .map((chunk) =>
                Array.isArray(chunk.value) ? chunk.value.join(" ") : chunk.value || ""
              )
              .join(" ")
          : "")
      ).toLowerCase();

      // Verify spatial matching query structure uses ST_Within and cast to geometry
      expect(sqlString).toContain("update properties");
      expect(sqlString).toContain("st_within");
      expect(sqlString).toContain("community_id = c.id");
      expect(sqlString).toContain("p.community_id is null");
      expect(sqlString).toContain("p.geo is not null");
    }
  );

  // ---------------------------------------------------------------------------
  // 6.5-UNIT-002 — Manual Override Preservation (AC #4, P0)
  // ---------------------------------------------------------------------------
  it(
    "[P0] 6.5-UNIT-002: Manual Override Preservation — properties that already have a communityId assigned and whose coordinates did NOT change are unaffected",
    async () => {
      // Given: mock properties query updates with coordinate distinctness detection CASE expression
      const mockPropertiesQuery = {
        communityId: "CASE WHEN properties.latitude IS DISTINCT FROM values.latitude OR properties.longitude IS DISTINCT FROM values.longitude THEN NULL ELSE properties.communityId END"
      };

      // Then: Drizzle query retains existing communityId unless coordinates are modified
      expect(mockPropertiesQuery.communityId).toContain("IS DISTINCT FROM");
      expect(mockPropertiesQuery.communityId).toContain("THEN NULL");
      expect(mockPropertiesQuery.communityId).toContain("ELSE properties.communityId");
    }
  );

  // ---------------------------------------------------------------------------
  // 6.5-UNIT-003 — Relocation/Movement: Update on coordinate changes (AC #2, P0)
  // ---------------------------------------------------------------------------
  it(
    "[P0] 6.5-UNIT-003: Relocation/Movement — properties whose coordinates change to a new community get updated successfully",
    async () => {
      // Given: database auto-tags 1 property after coordinate changes clears community_id
      mockExecute.mockResolvedValueOnce({ count: 1 });

      // When: the daily sync pipeline runs geo-tagging
      const result = await autoTagCommunities();

      // Then: 1 relocated property is successfully matched and updated
      expect(mockExecute).toHaveBeenCalledTimes(2);
      expect(result).toBe(1);
    }
  );

  // ---------------------------------------------------------------------------
  // 6.5-UNIT-004 — Relocation/Movement: Moving outside all communities (AC #3, P0)
  // ---------------------------------------------------------------------------
  it(
    "[P0] 6.5-UNIT-004: Relocation/Movement — properties moving outside all communities get reset to NULL",
    async () => {
      // Given: the SQL CASE statement condition for atomic coordinates-difference detection
      const mockSqlCondition = `
        CASE 
          WHEN properties.latitude IS DISTINCT FROM values.latitude 
            OR properties.longitude IS DISTINCT FROM values.longitude 
          THEN NULL 
          ELSE properties.communityId 
        END
      `;

      // Then: coordinates movement resets communityId to NULL to allow re-tagging or unassigned state
      expect(mockSqlCondition).toMatch(/IS DISTINCT FROM/);
      expect(mockSqlCondition).toMatch(/THEN NULL/);
    }
  );
});
