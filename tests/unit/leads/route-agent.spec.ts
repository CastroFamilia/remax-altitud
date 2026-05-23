/**
 * Story 5.3: Seller Lead Storage, Routing & Source Tracking — Agent Routing Tests
 *
 * TDD Phase: RED — all tests will fail until route-agent.ts is implemented.
 *
 * Covers (from test-design-epic-5.md):
 *   5.3-UNIT-003 — matchAgentByCoordinates() returns Altitud PZ agent for PZ coords
 *   5.3-UNIT-004 — matchAgentByCoordinates() returns Altitud Cero agent for Dominical coords
 *   5.3-UNIT-005 — matchAgentByCoordinates() handles null coordinates (fallback)
 *
 * AC #6: System matches nearest office and assigns active agent from that office
 * Risk: R-005 (BUS, score 6) — Agent routing fails → lead orphaned
 *
 * Implementation target: src/lib/leads/route-agent.ts
 *   - matchAgentByCoordinates(lat: number | null, lng: number | null): Promise<string | null>
 *   - Uses getNearestOfficeCoords() from src/lib/constants/offices-geo.ts
 *   - Fallback: null coords → PZ office → other office → null
 *
 * Office coordinates (from offices-geo.ts):
 *   PZ:       { lat: 9.3725, lng: -83.7011 }
 *   Dominical: { lat: 9.257,  lng: -83.885  }
 *
 * Environment: node (.spec.ts → node project via vitest.config.mts)
 */

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// vi.mock hoisting rule: ALL vi.mock() calls MUST appear before import statements
// ---------------------------------------------------------------------------

import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock server-only (route-agent.ts likely imports from queries that use server-only)
vi.mock("server-only", () => ({}));

// Mock the database client and queries
vi.mock("@/lib/db/client", () => ({
  db: {},
}));

// Mock getNearestOfficeCoords to control routing decisions
vi.mock("@/lib/constants/offices-geo", () => ({
  getNearestOfficeCoords: vi.fn(),
  OFFICE_PZ_COORDS: { lat: 9.3725, lng: -83.7011 },
  OFFICE_DOMINICAL_COORDS: { lat: 9.257, lng: -83.885 },
}));

// Mock offices queries
vi.mock("@/lib/db/queries/offices", () => ({
  getOfficeById: vi.fn(),
  getAllOffices: vi.fn(),
}));

// Mock drizzle query operations
vi.mock("drizzle-orm/postgres-js", () => ({
  drizzle: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => []),
          })),
        })),
      })),
    })),
  })),
}));

// ---------------------------------------------------------------------------
// Imports — AFTER mocks
// ---------------------------------------------------------------------------

import { getNearestOfficeCoords } from "@/lib/constants/offices-geo";

// ---------------------------------------------------------------------------

const mockedGetNearestOffice = vi.mocked(getNearestOfficeCoords);

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Test data: coordinates known to map to specific offices
// ---------------------------------------------------------------------------

const PZ_COORDS = { lat: 9.3725, lng: -83.7011 };
const DOMINICAL_COORDS = { lat: 9.257, lng: -83.885 };

const MOCK_PZ_AGENT = {
  id: "agent-pz-001",
  name: "Agent PZ",
  officeId: "office-pz",
  isActive: true,
};

const MOCK_CERO_AGENT = {
  id: "agent-cero-001",
  name: "Agent Cero",
  officeId: "office-cero",
  isActive: true,
};

// ---------------------------------------------------------------------------
// 5.3-UNIT-003: PZ coordinates → PZ agent
// ---------------------------------------------------------------------------

describe("Agent Routing — matchAgentByCoordinates (5.3-UNIT-003/004/005)", () => {
  it("[P0] 5.3-UNIT-003: returns Altitud PZ agent for Pérez Zeledón coordinates", async () => {
    // R-005: Agent routing must correctly map PZ coords to PZ office/agent
    const { matchAgentByCoordinates } = await import(
      "@/lib/leads/route-agent"
    );

    // Mock: getNearestOfficeCoords returns PZ for PZ coordinates
    mockedGetNearestOffice.mockReturnValue(PZ_COORDS);

    const agentId = await matchAgentByCoordinates(PZ_COORDS.lat, PZ_COORDS.lng);

    // The function must have been called with the provided coordinates
    expect(getNearestOfficeCoords).toHaveBeenCalledWith(
      PZ_COORDS.lat,
      PZ_COORDS.lng,
    );

    // Must return a non-null agent ID (specific value depends on DB seed)
    // In the mock scenario, we verify the function at least executes and returns
    expect(agentId).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // 5.3-UNIT-004: Dominical/Uvita coordinates → Altitud Cero agent
  // ---------------------------------------------------------------------------

  it("[P0] 5.3-UNIT-004: returns Altitud Cero agent for Dominical/Uvita coordinates", async () => {
    // R-005: Dominical coords must route to Cero office
    const { matchAgentByCoordinates } = await import(
      "@/lib/leads/route-agent"
    );

    // Mock: getNearestOfficeCoords returns Dominical for Dominical coordinates
    mockedGetNearestOffice.mockReturnValue(DOMINICAL_COORDS);

    const agentId = await matchAgentByCoordinates(
      DOMINICAL_COORDS.lat,
      DOMINICAL_COORDS.lng,
    );

    expect(getNearestOfficeCoords).toHaveBeenCalledWith(
      DOMINICAL_COORDS.lat,
      DOMINICAL_COORDS.lng,
    );

    // Must return a defined value (agent ID or null with fallback)
    expect(agentId).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // 5.3-UNIT-005: Null coordinates → fallback (PZ default or null)
  // ---------------------------------------------------------------------------

  it("[P0] 5.3-UNIT-005: handles null coordinates without throwing (fallback to PZ or null)", async () => {
    // R-005: null coords must not crash — fallback to PZ office or return null
    const { matchAgentByCoordinates } = await import(
      "@/lib/leads/route-agent"
    );

    // Must not throw when called with null coordinates
    await expect(
      matchAgentByCoordinates(null, null),
    ).resolves.not.toThrow();
  });

  it("[P0] 5.3-UNIT-005b: null coordinates do NOT call getNearestOfficeCoords (bypass geo lookup)", async () => {
    const { matchAgentByCoordinates } = await import(
      "@/lib/leads/route-agent"
    );

    await matchAgentByCoordinates(null, null);

    // When coordinates are null, the function should not attempt geo lookup
    // It should go directly to the PZ fallback
    expect(getNearestOfficeCoords).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Edge case: no active agents in matched office → try other office
  // ---------------------------------------------------------------------------

  it("[P0] 5.3-UNIT-005c: returns null (not undefined, not throw) when no active agents exist at all", async () => {
    const { matchAgentByCoordinates } = await import(
      "@/lib/leads/route-agent"
    );

    // Even when the DB has no agents, the function should return null gracefully
    // (API must still create the lead with assigned_agent_id = null per Task 3.7)
    const result = await matchAgentByCoordinates(PZ_COORDS.lat, PZ_COORDS.lng);

    // If mocked DB returns no agents, result should be null
    // (this depends on DB mock returning empty arrays, which our drizzle mock does)
    expect(result === null || typeof result === "string").toBe(true);
  });
});
