/**
 * Story 8.1: Sync Status Dashboard & Monitoring — Server Actions Unit Tests
 * Module: src/app/actions/admin-sync-actions.ts
 *
 * Covers:
 *   - Task 3: Implement fetchAdminSyncDashboardData Server Action.
 *   - AC #1, #3, #4: Filters, dates parsing, pagination offset, and stats fetching.
 *
 * marked with describe.skip for the TDD RED phase.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the queries
vi.mock("@/lib/db/queries/sync-log", () => ({
  getSyncLogs: vi.fn(),
  getSyncDashboardStats: vi.fn(),
}));

import { fetchAdminSyncDashboardData } from "@/app/actions/admin-sync-actions";
import { getSyncLogs, getSyncDashboardStats } from "@/lib/db/queries/sync-log";

describe.skip("Story 8.1: Admin Sync Actions Unit Tests (RED PHASE)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("[P0] 8.1-UNIT-007: fetchAdminSyncDashboardData calls DB query helpers with parsed params", async () => {
    const mockLogs = [
      { id: "log-1", status: "success", startedAt: new Date(), completedAt: new Date() }
    ];
    const mockStats = { activeListings: 15, lastSuccessfulSync: new Date() };

    vi.mocked(getSyncLogs).mockResolvedValueOnce(mockLogs);
    vi.mocked(getSyncDashboardStats).mockResolvedValueOnce(mockStats);

    const result = await fetchAdminSyncDashboardData({
      status: "success",
      startDateStr: "2026-05-01",
      endDateStr: "2026-05-28",
      page: 2
    });

    expect(getSyncLogs).toHaveBeenCalledWith({
      status: "success",
      startDate: expect.any(Date),
      endDate: expect.any(Date),
      limit: 20,
      offset: 20,
    });
    expect(getSyncDashboardStats).toHaveBeenCalledOnce();
    expect(result).toEqual({
      logs: mockLogs,
      stats: mockStats,
    });
  });

  it("[P1] 8.1-UNIT-008: handles invalid or missing date strings gracefully with fallbacks", async () => {
    vi.mocked(getSyncLogs).mockResolvedValueOnce([]);
    vi.mocked(getSyncDashboardStats).mockResolvedValueOnce({ activeListings: 0, lastSuccessfulSync: null });

    await fetchAdminSyncDashboardData({
      startDateStr: "invalid-date",
      endDateStr: "",
    });

    expect(getSyncLogs).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      startDate: undefined,
      endDate: undefined,
    });
  });
});
