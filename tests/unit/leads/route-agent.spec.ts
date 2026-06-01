/**
 * Story 5.3: Seller Lead Storage, Routing & Source Tracking — Agent Routing Tests
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

// ---------------------------------------------------------------------------
// Configurable mock state — used by tests to control DB responses
// ---------------------------------------------------------------------------

const mockAllOffices: Array<{ id: string; latitude: number; longitude: number }> = [];
const mockAgentRows: Array<{ id: string }> = [];

// Mock the database client with a configurable select chain
vi.mock("@/lib/db/client", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => mockAgentRows),
          })),
        })),
      })),
    })),
  },
}));

// Mock getNearestOfficeCoords to control routing decisions
vi.mock("@/lib/constants/offices-geo", () => ({
  getNearestOfficeCoords: vi.fn(),
  OFFICE_PZ_COORDS: { lat: 9.3725, lng: -83.7011 },
  OFFICE_DOMINICAL_COORDS: { lat: 9.257, lng: -83.885 },
}));

// Mock offices queries — getAllOffices returns the configurable array
vi.mock("@/lib/db/queries/offices", () => ({
  getOfficeById: vi.fn(),
  getAllOffices: vi.fn(() => Promise.resolve(mockAllOffices)),
}));

// Mock drizzle-orm operators (and, eq, desc used in route-agent.ts; sql used in agents schema)
vi.mock("drizzle-orm", () => ({
  and: vi.fn((...args: unknown[]) => args),
  eq: vi.fn((a: unknown, b: unknown) => [a, b]),
  desc: vi.fn((col: unknown) => col),
  gte: vi.fn((a: unknown, b: unknown) => [a, b]),
  sql: new Proxy(() => "", { apply: () => "", get: () => "" }),
}));

// ---------------------------------------------------------------------------
// Imports — AFTER mocks
// ---------------------------------------------------------------------------

import { getNearestOfficeCoords } from "@/lib/constants/offices-geo";
import { getAllOffices } from "@/lib/db/queries/offices";

// ---------------------------------------------------------------------------

const mockedGetNearestOffice = vi.mocked(getNearestOfficeCoords);

// ---------------------------------------------------------------------------
// Test data: coordinates and mock office/agent records
// ---------------------------------------------------------------------------

const PZ_COORDS = { lat: 9.3725, lng: -83.7011 };
const DOMINICAL_COORDS = { lat: 9.257, lng: -83.885 };

const OFFICE_PZ = { id: "office-pz", latitude: 9.3725, longitude: -83.7011 };
const OFFICE_CERO = { id: "office-cero", latitude: 9.257, longitude: -83.885 };

beforeEach(() => {
  vi.clearAllMocks();
  // Reset configurable state
  mockAllOffices.length = 0;
  mockAgentRows.length = 0;
});

// ---------------------------------------------------------------------------
// 5.3-UNIT-003: PZ coordinates → PZ agent
// ---------------------------------------------------------------------------

describe("Agent Routing — matchAgentByCoordinates (5.3-UNIT-003/004/005)", () => {
  it("[P0] 5.3-UNIT-003: returns Altitud PZ agent for Pérez Zeledón coordinates", async () => {
    // R-005: Agent routing must correctly map PZ coords to PZ office/agent
    const { matchAgentByCoordinates } = await import(
      "@/lib/leads/route-agent"
    );

    // Seed mock data: offices and agent
    mockAllOffices.push(OFFICE_PZ, OFFICE_CERO);
    mockAgentRows.push({ id: "agent-pz-001" });

    // Mock: getNearestOfficeCoords returns PZ for PZ coordinates
    mockedGetNearestOffice.mockReturnValue(PZ_COORDS);

    const agentId = await matchAgentByCoordinates(PZ_COORDS.lat, PZ_COORDS.lng);

    // The function must have been called with the provided coordinates
    expect(getNearestOfficeCoords).toHaveBeenCalledWith(
      PZ_COORDS.lat,
      PZ_COORDS.lng,
    );

    // getAllOffices must have been called to look up office by coords
    expect(getAllOffices).toHaveBeenCalled();

    // Must return the PZ agent ID — not null, not undefined
    expect(agentId).toBe("agent-pz-001");
  });

  // ---------------------------------------------------------------------------
  // 5.3-UNIT-004: Dominical/Uvita coordinates → Altitud Cero agent
  // ---------------------------------------------------------------------------

  it("[P0] 5.3-UNIT-004: returns Altitud Cero agent for Dominical/Uvita coordinates", async () => {
    // R-005: Dominical coords must route to Cero office
    const { matchAgentByCoordinates } = await import(
      "@/lib/leads/route-agent"
    );

    // Seed mock data: offices and agent
    mockAllOffices.push(OFFICE_PZ, OFFICE_CERO);
    mockAgentRows.push({ id: "agent-cero-001" });

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

    // Must return the Cero agent ID
    expect(agentId).toBe("agent-cero-001");
  });

  // ---------------------------------------------------------------------------
  // 5.3-UNIT-005: Null coordinates → fallback (PZ default or null)
  // ---------------------------------------------------------------------------

  it("[P0] 5.3-UNIT-005: handles null coordinates without throwing (fallback to PZ or null)", async () => {
    // R-005: null coords must not crash — fallback to PZ office or return null
    const { matchAgentByCoordinates } = await import(
      "@/lib/leads/route-agent"
    );

    // Seed offices but no agents — so the function should return null gracefully
    mockAllOffices.push(OFFICE_PZ, OFFICE_CERO);

    const result = await matchAgentByCoordinates(null, null);

    // With no agents seeded, should return null (not undefined, not throw)
    expect(result).toBeNull();
  });

  it("[P0] 5.3-UNIT-005b: null coordinates do NOT call getNearestOfficeCoords (bypass geo lookup)", async () => {
    const { matchAgentByCoordinates } = await import(
      "@/lib/leads/route-agent"
    );

    mockAllOffices.push(OFFICE_PZ, OFFICE_CERO);

    await matchAgentByCoordinates(null, null);

    // When coordinates are null, the function should not attempt geo lookup
    // It should go directly to the PZ fallback
    expect(getNearestOfficeCoords).not.toHaveBeenCalled();
  });

  it("[P0] 5.3-UNIT-005c: null coords with PZ agent seeded returns the PZ fallback agent", async () => {
    const { matchAgentByCoordinates } = await import(
      "@/lib/leads/route-agent"
    );

    // Seed offices and a PZ agent for fallback
    mockAllOffices.push(OFFICE_PZ, OFFICE_CERO);
    mockAgentRows.push({ id: "agent-pz-fallback" });

    const result = await matchAgentByCoordinates(null, null);

    // Should return PZ fallback agent since null coords default to PZ
    expect(result).toBe("agent-pz-fallback");
    expect(getNearestOfficeCoords).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Edge case: no active agents in matched office → try other office → null
  // ---------------------------------------------------------------------------

  it("[P0] 5.3-UNIT-005d: returns null when no active agents exist in any office", async () => {
    const { matchAgentByCoordinates } = await import(
      "@/lib/leads/route-agent"
    );

    // Seed offices but NO agents
    mockAllOffices.push(OFFICE_PZ, OFFICE_CERO);
    // mockAgentRows stays empty — no agents in DB

    mockedGetNearestOffice.mockReturnValue(PZ_COORDS);

    const result = await matchAgentByCoordinates(PZ_COORDS.lat, PZ_COORDS.lng);

    // Must return null gracefully (API will create lead with assigned_agent_id = null per Task 3.7)
    expect(result).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Edge case: no offices in DB
  // ---------------------------------------------------------------------------

  it("[P0] 5.3-UNIT-005e: returns null gracefully when no offices exist in DB", async () => {
    const { matchAgentByCoordinates } = await import(
      "@/lib/leads/route-agent"
    );

    // No offices seeded — mockAllOffices is empty
    mockedGetNearestOffice.mockReturnValue(PZ_COORDS);

    const result = await matchAgentByCoordinates(PZ_COORDS.lat, PZ_COORDS.lng);

    // No matching office → no agent → return null
    expect(result).toBeNull();
  });
});
