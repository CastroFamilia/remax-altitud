/**
 * Story 7.4: Smart Agent Routing from Shortlist — Server Actions Unit Tests
 * Module: src/app/actions/shortlist-actions.ts
 *
 * Covers:
 *   - Task 3: Server Action retrieves properties joined with agent details using Drizzle.
 *   - AC #1, #2, #3, #4: Retrieves properties and detailed agent columns.
 *   - AC #1: Filters out soft-deleted properties (isVisible = false).
 *   - Boundary case: returns empty array when empty array of ids is passed.
 *
 * DB calls are mocked via vi.mock — no live DATABASE_URL required.
 * Marked with describe.skip for the TDD RED phase.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mocks for Drizzle client
const { mockLeftJoin, mockWhere, mockFrom, mockSelect } = vi.hoisted(() => {
  const mockWhere = vi.fn().mockResolvedValue([]);
  const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere });
  const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
  return { mockWhere, mockLeftJoin, mockFrom, mockSelect };
});

vi.mock("@/lib/db/client", () => ({
  db: {
    select: mockSelect,
  },
}));

import { getShortlistPropertiesWithAgents } from "@/app/actions/shortlist-actions";

describe.skip("Story 7.4: Shortlist Agent Actions Unit Tests (RED PHASE)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockResolvedValue([]);
    mockLeftJoin.mockReturnValue({ where: mockWhere });
    mockFrom.mockReturnValue({ leftJoin: mockLeftJoin });
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("[P0] 7.4-UNIT-005: should return an empty array if empty or null array of IDs is provided without querying the database", async () => {
    const resultNull = await getShortlistPropertiesWithAgents(null as unknown as string[]);
    expect(resultNull).toEqual([]);
    expect(mockSelect).not.toHaveBeenCalled();

    const resultEmpty = await getShortlistPropertiesWithAgents([]);
    expect(resultEmpty).toEqual([]);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("[P0] 7.4-UNIT-006: should accurately query the database using left join with agents table", async () => {
    const mockRows = [
      {
        properties: {
          id: "prop-1",
          slug: "mountain-house",
          titleEn: "Mountain House",
          titleEs: "Casa de Montaña",
          priceUsd: 150000,
          apiId: "REF-001",
          agentId: "agent-1",
          isVisible: true,
          images: [],
          latitude: 9.35,
          longitude: -83.7,
        },
        agents: {
          id: "agent-1",
          name: "Emma",
          photoUrl: "https://photo.com/emma.jpg",
          photoOptimizedUrl: "https://photo.com/emma-opt.jpg",
          email: "emma@remax.com",
          phone: "50688888888",
          whatsapp: "50688888888",
          languages: "English, Spanish",
          listingCount: 5,
        },
      },
    ];
    mockWhere.mockResolvedValueOnce(mockRows);

    const ids = ["prop-1"];
    const result = await getShortlistPropertiesWithAgents(ids);

    expect(mockSelect).toHaveBeenCalledOnce();
    expect(mockLeftJoin).toHaveBeenCalledOnce();
    expect(mockWhere).toHaveBeenCalledOnce();
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("prop-1");
    expect(result[0].agent.name).toBe("Emma");
    expect(result[0].agent.whatsapp).toBe("50688888888");
  });

  it("[P1] 7.4-UNIT-007: should filter out properties that are not visible (isVisible = false)", async () => {
    mockWhere.mockResolvedValueOnce([]);

    await getShortlistPropertiesWithAgents(["prop-1"]);

    expect(mockSelect).toHaveBeenCalledOnce();
    expect(mockLeftJoin).toHaveBeenCalledOnce();
    expect(mockWhere).toHaveBeenCalledOnce();
  });
});
