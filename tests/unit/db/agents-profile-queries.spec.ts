/**
 * Story 4.3: Agent Profile Pages — ATDD Red-Phase Scaffold
 * Module: src/lib/db/queries/agents.ts (new functions added in Task 1)
 *
 * TDD Phase: RED — all tests are test.skip() until the query functions are implemented.
 * Remove test.skip() per test when implementing to verify green phase.
 *
 * Covers:
 *   AC #6  — Agent pages are SSG/ISR (NFR25) — getAllAgentSlugs powers generateStaticParams
 *   AC #7  — Agent data is sourced from the synced database (Epic 2)
 *   Task 1 — Add getAllAgents, getAgentBySlug, getAllAgentSlugs, getPropertiesByAgentId
 *
 * Test IDs from test-design-epic-4.md:
 *   4.3-UNIT-001 — Agent profile page is generated with ISR revalidate = 86400 (NFR25)
 *   4.3-UNIT-002 — Agent profile renders gracefully with empty listings array
 *
 * Environment: node (pure function DB query tests — .spec.ts → node via vitest.config.mts)
 *
 * NOTE: This file is .ts (not .tsx) — node environment, pure function tests, no JSX.
 */

import { afterEach, beforeEach, describe, expect, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mock primitives for Drizzle query builder chain
// ---------------------------------------------------------------------------

const {
  mockLimit,
  mockWhere,
  mockOrderBy,
  mockSelect,
  mockFrom,
  mockDb,
} = vi.hoisted(() => {
  const mockLimit = vi.fn().mockResolvedValue([]);
  const mockOrderBy = vi.fn().mockResolvedValue([]);
  const mockWhere = vi.fn().mockReturnValue({
    orderBy: vi.fn().mockResolvedValue([]),
    limit: mockLimit,
  });
  const mockFrom = vi.fn().mockReturnValue({
    where: mockWhere,
    orderBy: mockOrderBy,
  });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
  const mockDb = { select: mockSelect };

  return { mockLimit, mockWhere, mockOrderBy, mockSelect, mockFrom, mockDb };
});

// ---------------------------------------------------------------------------
// Mock Drizzle client
// ---------------------------------------------------------------------------

vi.mock("@/lib/db/client", () => ({
  db: mockDb,
}));

// imported AFTER mocks
import { beforeAll } from "vitest";

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeAll(() => {
  // Node environment — no special setup needed
});

beforeEach(() => {
  vi.clearAllMocks();

  // Default responses for chain setup
  mockLimit.mockResolvedValue([]);
  mockOrderBy.mockResolvedValue([]);

  const whereChain = {
    orderBy: mockOrderBy,
    limit: mockLimit,
  };
  mockWhere.mockReturnValue(whereChain);
  mockFrom.mockReturnValue({ where: mockWhere, orderBy: mockOrderBy });
  mockSelect.mockReturnValue({ from: mockFrom });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// getAgentBySlug — RED PHASE
// ---------------------------------------------------------------------------

describe("getAgentBySlug (ATDD Red Phase)", () => {
  test.skip("[P0] 4.3-DB-001: calls db.select and filters by agents.slug with limit(1)", async () => {
    // THIS TEST WILL FAIL — getAgentBySlug not yet implemented
    const { getAgentBySlug } = await import("@/lib/db/queries/agents");
    await getAgentBySlug("emma-smith");

    expect(mockSelect).toHaveBeenCalledOnce();
    expect(mockWhere).toHaveBeenCalledOnce();
    // limit(1) must be called to avoid returning multiple rows
    expect(mockLimit).toHaveBeenCalledWith(1);
  });

  test.skip("[P0] 4.3-DB-002: returns null when no agent row is found for the given slug", async () => {
    // THIS TEST WILL FAIL — getAgentBySlug not yet implemented
    mockLimit.mockResolvedValueOnce([]); // empty result

    const { getAgentBySlug } = await import("@/lib/db/queries/agents");
    const result = await getAgentBySlug("nonexistent-slug");

    expect(result).toBeNull();
  });

  test.skip("[P0] 4.3-DB-003: returns the first agent row when found", async () => {
    // THIS TEST WILL FAIL — getAgentBySlug not yet implemented
    const agentRow = {
      id: "agent-uuid-1",
      slug: "emma-smith",
      name: "Emma Smith",
      isActive: true,
    };
    mockLimit.mockResolvedValueOnce([agentRow]);

    const { getAgentBySlug } = await import("@/lib/db/queries/agents");
    const result = await getAgentBySlug("emma-smith");

    expect(result).toEqual(agentRow);
  });
});

// ---------------------------------------------------------------------------
// getAllAgentSlugs — RED PHASE
// ---------------------------------------------------------------------------

describe("getAllAgentSlugs (ATDD Red Phase)", () => {
  test.skip("[P0] 4.3-DB-004: returns array of slug strings for all active agents", async () => {
    // THIS TEST WILL FAIL — getAllAgentSlugs not yet implemented
    mockWhere.mockResolvedValueOnce([{ slug: "emma-smith" }, { slug: "gustavo-valverde" }]);

    const { getAllAgentSlugs } = await import("@/lib/db/queries/agents");
    const result = await getAllAgentSlugs();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toContain("emma-smith");
    expect(result).toContain("gustavo-valverde");
  });

  test.skip("[P0] 4.3-DB-005: filters by isActive=true (does not include inactive agents)", async () => {
    // THIS TEST WILL FAIL — getAllAgentSlugs not yet implemented
    // Only active agents should be returned (for SSG generateStaticParams)
    mockWhere.mockResolvedValueOnce([{ slug: "emma-smith" }]);

    const { getAllAgentSlugs } = await import("@/lib/db/queries/agents");
    await getAllAgentSlugs();

    // db.select().from(agents).where(eq(agents.isActive, true)) must be called
    expect(mockWhere).toHaveBeenCalledOnce();
  });

  test.skip("[P1] 4.3-DB-006: returns empty array when no active agents exist", async () => {
    // THIS TEST WILL FAIL — getAllAgentSlugs not yet implemented
    mockWhere.mockResolvedValueOnce([]);

    const { getAllAgentSlugs } = await import("@/lib/db/queries/agents");
    const result = await getAllAgentSlugs();

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getAllAgents — RED PHASE
// ---------------------------------------------------------------------------

describe("getAllAgents (ATDD Red Phase)", () => {
  test.skip("[P1] 4.3-DB-007: calls db.select and orders by listingCount descending", async () => {
    // THIS TEST WILL FAIL — getAllAgents not yet implemented
    mockWhere.mockReturnValueOnce({ orderBy: mockOrderBy });
    mockOrderBy.mockResolvedValueOnce([]);

    const { getAllAgents } = await import("@/lib/db/queries/agents");
    await getAllAgents();

    expect(mockSelect).toHaveBeenCalledOnce();
    // Must include orderBy for descending listing count sort
    expect(mockOrderBy).toHaveBeenCalledOnce();
  });

  test.skip("[P1] 4.3-DB-008: returns agents array ordered by listingCount desc", async () => {
    // THIS TEST WILL FAIL — getAllAgents not yet implemented
    const agents = [
      { id: "a1", name: "Emma Smith", listingCount: 12 },
      { id: "a2", name: "Gustavo Valverde", listingCount: 3 },
    ];
    mockWhere.mockReturnValueOnce({ orderBy: mockOrderBy });
    mockOrderBy.mockResolvedValueOnce(agents);

    const { getAllAgents } = await import("@/lib/db/queries/agents");
    const result = await getAllAgents();

    expect(result).toEqual(agents);
    // First agent must have higher listing count
    expect(result[0].listingCount).toBeGreaterThan(result[1].listingCount);
  });
});

// ---------------------------------------------------------------------------
// getPropertiesByAgentId — RED PHASE
// ---------------------------------------------------------------------------

describe("getPropertiesByAgentId (ATDD Red Phase)", () => {
  test.skip("[P1] 4.3-DB-009: filters properties by agentId AND isVisible=true", async () => {
    // THIS TEST WILL FAIL — getPropertiesByAgentId not yet implemented
    // Must use and(eq(properties.agentId, agentId), eq(properties.isVisible, true))
    mockWhere.mockReturnValueOnce({ orderBy: mockOrderBy });
    mockOrderBy.mockResolvedValueOnce([]);

    const { getPropertiesByAgentId } = await import("@/lib/db/queries/agents");
    await getPropertiesByAgentId("agent-uuid-1");

    expect(mockWhere).toHaveBeenCalledOnce();
    // The where call must receive a compound condition (and(...))
    // We verify it was called — the exact args depend on drizzle eq/and internals
  });

  test.skip("[P1] 4.3-DB-010: returns properties ordered by syncedAt descending", async () => {
    // THIS TEST WILL FAIL — getPropertiesByAgentId not yet implemented
    const properties = [
      { id: "p1", slug: "mountain-home", agentId: "agent-uuid-1", isVisible: true },
      { id: "p2", slug: "beach-condo", agentId: "agent-uuid-1", isVisible: true },
    ];
    mockWhere.mockReturnValueOnce({ orderBy: mockOrderBy });
    mockOrderBy.mockResolvedValueOnce(properties);

    const { getPropertiesByAgentId } = await import("@/lib/db/queries/agents");
    const result = await getPropertiesByAgentId("agent-uuid-1");

    expect(result).toEqual(properties);
  });

  test.skip("[P1] 4.3-DB-011: returns empty array when agent has no visible properties", async () => {
    // THIS TEST WILL FAIL — getPropertiesByAgentId not yet implemented
    mockWhere.mockReturnValueOnce({ orderBy: mockOrderBy });
    mockOrderBy.mockResolvedValueOnce([]);

    const { getPropertiesByAgentId } = await import("@/lib/db/queries/agents");
    const result = await getPropertiesByAgentId("agent-uuid-1");

    expect(result).toEqual([]);
  });
});
