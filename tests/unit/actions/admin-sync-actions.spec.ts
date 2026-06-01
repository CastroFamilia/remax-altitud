/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Story 8.1: Sync Status Dashboard & Monitoring — Server Actions Unit Tests
 * Module: src/app/actions/admin-sync-actions.ts
 *
 * Covers:
 *   - Task 3: Implement fetchAdminSyncDashboardData Server Action.
 *   - AC #1, #3, #4: Filters, dates parsing, pagination offset, and stats fetching.
 *   - Secure Admin Authentication (NFR8): loginAdmin / logoutAdmin.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mocks for next/headers cookies
const { mockCookieSet, mockCookieDelete, mockCookieGet } = vi.hoisted(() => ({
  mockCookieSet: vi.fn(),
  mockCookieDelete: vi.fn(),
  mockCookieGet: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: mockCookieGet,
    set: mockCookieSet,
    delete: mockCookieDelete,
  })),
}));

// Mock the queries
vi.mock("@/lib/db/queries/sync-log", () => ({
  getSyncLogs: vi.fn(),
  getSyncDashboardStats: vi.fn(),
}));

import {
  fetchAdminSyncDashboardData,
  loginAdmin,
  logoutAdmin,
} from "@/app/actions/admin-sync-actions";
import { getSyncLogs, getSyncDashboardStats } from "@/lib/db/queries/sync-log";

describe("Story 8.1: Admin Sync Actions Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // fetchAdminSyncDashboardData Tests
  // ---------------------------------------------------------------------------
  describe("fetchAdminSyncDashboardData", () => {
    it("[P0] 8.1-UNIT-007: fetchAdminSyncDashboardData calls DB query helpers with parsed params", async () => {
      const mockLogs = [
        { id: "log-1", status: "success", startedAt: new Date(), completedAt: new Date() }
      ];
      const mockStats = { activeListings: 15, lastSuccessfulSync: new Date() };

      vi.mocked(getSyncLogs).mockResolvedValueOnce(mockLogs as any);
      vi.mocked(getSyncDashboardStats).mockResolvedValueOnce(mockStats as any);

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
        limit: 21,
        offset: 20,
      });

      // Verify the precise parsing and timezone/hour boundary for end date (23:59:59.999)
      const callArgs = vi.mocked(getSyncLogs).mock.calls[0][0];
      expect(callArgs.startDate?.toISOString()).toBe(new Date("2026-05-01").toISOString());
      expect(callArgs.endDate?.getUTCHours()).toBe(23);
      expect(callArgs.endDate?.getUTCMinutes()).toBe(59);
      expect(callArgs.endDate?.getUTCSeconds()).toBe(59);
      expect(callArgs.endDate?.getUTCMilliseconds()).toBe(999);

      expect(getSyncDashboardStats).toHaveBeenCalledOnce();
      expect(result).toEqual({
        logs: mockLogs,
        stats: mockStats,
        hasMore: false,
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
        limit: 21,
        offset: 0,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it("[P2] 8.1-UNIT-008b: normalizes invalid, negative or NaN page numbers to page 1", async () => {
      vi.mocked(getSyncLogs).mockResolvedValue([]);
      vi.mocked(getSyncDashboardStats).mockResolvedValue({ activeListings: 0, lastSuccessfulSync: null });

      await fetchAdminSyncDashboardData({
        page: NaN,
      });

      expect(getSyncLogs).toHaveBeenCalledWith({
        limit: 21,
        offset: 0,
        startDate: undefined,
        endDate: undefined,
      });

      await fetchAdminSyncDashboardData({
        page: -5,
      });

      expect(getSyncLogs).toHaveBeenLastCalledWith({
        limit: 21,
        offset: 0,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it("[P2] 8.1-UNIT-008c: filters out dates outside 1970-2100 range to prevent DB range errors", async () => {
      vi.mocked(getSyncLogs).mockResolvedValueOnce([]);
      vi.mocked(getSyncDashboardStats).mockResolvedValueOnce({ activeListings: 0, lastSuccessfulSync: null });

      await fetchAdminSyncDashboardData({
        startDateStr: "1850-01-01",
        endDateStr: "2150-12-31",
      });

      expect(getSyncLogs).toHaveBeenCalledWith({
        limit: 21,
        offset: 0,
        startDate: undefined,
        endDate: undefined,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // loginAdmin Tests
  // ---------------------------------------------------------------------------
  describe("loginAdmin", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("[P0] 8.1-UNIT-009: loginAdmin sets httpOnly secure cookie when password matches ADMIN_PASSWORD", async () => {
      vi.stubEnv("ADMIN_PASSWORD", "test-password");
      vi.stubEnv("NODE_ENV", "production");

      const result = await loginAdmin("test-password");

      expect(result).toEqual({ success: true });
      expect(mockCookieSet).toHaveBeenCalledWith(
        "admin_session",
        "c638833f69bbfb3c267afa0a74434812436b8f08a81fd263c6be6871de4f1265",
        {
          httpOnly: true,
          secure: true,
          maxAge: 60 * 60 * 24,
          path: "/",
          sameSite: "strict",
        }
      );
    });

    it("[P1] 8.1-UNIT-010: loginAdmin rejects invalid password", async () => {
      vi.stubEnv("ADMIN_PASSWORD", "test-password");

      const result = await loginAdmin("wrong-password");

      expect(result).toEqual({ success: false });
      expect(mockCookieSet).not.toHaveBeenCalled();
    });

    it("[P1] 8.1-UNIT-011: loginAdmin returns success=false if ADMIN_PASSWORD is not configured in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      // ensure ADMIN_PASSWORD is not set
      vi.stubEnv("ADMIN_PASSWORD", "");

      const result = await loginAdmin("admin");

      expect(result).toEqual({ success: false });
      expect(mockCookieSet).not.toHaveBeenCalled();
    });

    it("[P2] 8.1-UNIT-012: loginAdmin falls back to default 'admin' password in non-production", async () => {
      vi.stubEnv("NODE_ENV", "development");
      // ensure ADMIN_PASSWORD is not set
      vi.stubEnv("ADMIN_PASSWORD", "");

      const result = await loginAdmin("admin");

      expect(result).toEqual({ success: true });
      expect(mockCookieSet).toHaveBeenCalledWith(
        "admin_session",
        "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
        {
          httpOnly: true,
          secure: true,
          maxAge: 60 * 60 * 24,
          path: "/",
          sameSite: "strict",
        }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // logoutAdmin Tests
  // ---------------------------------------------------------------------------
  describe("logoutAdmin", () => {
    it("[P0] 8.1-UNIT-013: logoutAdmin deletes the admin_session cookie", async () => {
      await logoutAdmin();

      expect(mockCookieDelete).toHaveBeenCalledWith("admin_session");
    });
  });
});
