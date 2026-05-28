/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Story 8.1: Sync Status Dashboard & Monitoring — DB Query Helpers Unit Tests
 * Module: src/lib/db/queries/sync-log.ts
 *
 * Covers:
 *   - Task 2: Define getSyncLogs and getSyncDashboardStats.
 *   - AC #1, #3, #4: Filters, ordering, stats fetching, duration parsing.
 *
 * DB calls are mocked via Vitest vi.mocked chains.
 * Marked with describe.skip for the TDD RED phase.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  const mockLimit = vi.fn();
  const mockWhere = vi.fn();
  const mockOrderBy = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();

  const mockQuery: any = {
    where: mockWhere,
    orderBy: mockOrderBy,
    limit: mockLimit,
    offset: vi.fn().mockReturnThis(),
    then: (onfulfilled: any) => Promise.resolve([]).then(onfulfilled),
    catch: (onrejected: any) => Promise.resolve([]).catch(onrejected),
  };

  mockSelect.mockReturnValue({ from: mockFrom });
  mockFrom.mockReturnValue(mockQuery);
  mockWhere.mockReturnValue(mockQuery);
  mockOrderBy.mockReturnValue(mockQuery);
  mockLimit.mockReturnValue(mockQuery);

  const mockDb = { select: mockSelect };

  return { mockLimit, mockWhere, mockOrderBy, mockSelect, mockFrom, mockDb };
});

vi.mock("@/lib/db/client", () => ({
  db: mockDb,
}));

beforeEach(() => {
  vi.clearAllMocks();

  const mockQuery: any = {
    where: mockWhere,
    orderBy: mockOrderBy,
    limit: mockLimit,
    offset: vi.fn().mockReturnThis(),
    then: (onfulfilled: any) => Promise.resolve([]).then(onfulfilled),
    catch: (onrejected: any) => Promise.resolve([]).catch(onrejected),
  };

  mockSelect.mockReturnValue({ from: mockFrom });
  mockFrom.mockReturnValue(mockQuery);
  mockWhere.mockReturnValue(mockQuery);
  mockOrderBy.mockReturnValue(mockQuery);
  mockLimit.mockReturnValue(mockQuery);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// getSyncLogs — RED PHASE
// ---------------------------------------------------------------------------
describe("getSyncLogs (ATDD Red Phase)", () => {
  it("[P0] 8.1-UNIT-001: fetches chronological sync logs successfully", async () => {
    const { getSyncLogs } = await import("@/lib/db/queries/sync-log");
    await getSyncLogs({});

    expect(mockSelect).toHaveBeenCalledOnce();
    expect(mockOrderBy).toHaveBeenCalledOnce();
  });

  it("[P1] 8.1-UNIT-002: filters by status correctly when status filter is provided", async () => {
    const { getSyncLogs } = await import("@/lib/db/queries/sync-log");
    await getSyncLogs({ status: "failure" });

    expect(mockSelect).toHaveBeenCalledOnce();
    expect(mockWhere).toHaveBeenCalledOnce();
  });

  it("[P1] 8.1-UNIT-003: filters by date range correctly when dates are provided", async () => {
    const { getSyncLogs } = await import("@/lib/db/queries/sync-log");
    await getSyncLogs({ startDate: new Date("2026-05-01"), endDate: new Date("2026-05-28") });

    expect(mockSelect).toHaveBeenCalledOnce();
    expect(mockWhere).toHaveBeenCalledOnce();
  });

  it("[P2] 8.1-UNIT-004: supports pagination limit and offset parameters", async () => {
    const { getSyncLogs } = await import("@/lib/db/queries/sync-log");
    await getSyncLogs({ limit: 10, offset: 20 });

    expect(mockLimit).toHaveBeenCalledWith(10);
  });
});

// ---------------------------------------------------------------------------
// getSyncDashboardStats — RED PHASE
// ---------------------------------------------------------------------------
describe("getSyncDashboardStats (ATDD Red Phase)", () => {
  it("[P0] 8.1-UNIT-005: retrieves active listings count and last successful sync", async () => {
    const { getSyncDashboardStats } = await import("@/lib/db/queries/sync-log");
    const result = await getSyncDashboardStats();

    expect(mockSelect).toHaveBeenCalled();
    expect(result).toHaveProperty("activeListings");
    expect(result).toHaveProperty("lastSuccessfulSync");
  });
});

// ---------------------------------------------------------------------------
// Formatting Helpers Unit Tests
// ---------------------------------------------------------------------------
describe("formatSyncDuration Formatting Helper (ATDD Red Phase)", () => {
  it("[P2] 8.1-UNIT-006: converts sync duration in milliseconds to human-readable format", async () => {
    const { formatSyncDuration } = await import("@/lib/db/queries/sync-log");

    expect(formatSyncDuration(5000000)).toBe("1h 23m 20s");
    expect(formatSyncDuration(65000)).toBe("1m 5s");
    expect(formatSyncDuration(500)).toBe("0s");
  });
});
