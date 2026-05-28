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
        limit: 20,
        offset: 20,
      });

      // Verify the precise parsing and timezone/hour boundary for end date (23:59:59.999)
      const callArgs = vi.mocked(getSyncLogs).mock.calls[0][0];
      expect(callArgs.startDate?.toISOString()).toBe(new Date("2026-05-01").toISOString());
      expect(callArgs.endDate?.getHours()).toBe(23);
      expect(callArgs.endDate?.getMinutes()).toBe(59);
      expect(callArgs.endDate?.getSeconds()).toBe(59);
      expect(callArgs.endDate?.getMilliseconds()).toBe(999);

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

  // ---------------------------------------------------------------------------
  // loginAdmin Tests
  // ---------------------------------------------------------------------------
  describe("loginAdmin", () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
      delete process.env.ADMIN_PASSWORD;
    });

    it("[P0] 8.1-UNIT-009: loginAdmin sets httpOnly secure cookie when password matches ADMIN_PASSWORD", async () => {
      process.env.ADMIN_PASSWORD = "test-password";
      process.env.NODE_ENV = "production";

      const result = await loginAdmin("test-password");

      expect(result).toEqual({ success: true });
      expect(mockCookieSet).toHaveBeenCalledWith("admin_session", "test-password", {
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24,
        path: "/",
      });
    });

    it("[P1] 8.1-UNIT-010: loginAdmin rejects invalid password", async () => {
      process.env.ADMIN_PASSWORD = "test-password";

      const result = await loginAdmin("wrong-password");

      expect(result).toEqual({ success: false });
      expect(mockCookieSet).not.toHaveBeenCalled();
    });

    it("[P1] 8.1-UNIT-011: loginAdmin returns success=false if ADMIN_PASSWORD is not configured in production", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.ADMIN_PASSWORD;

      const result = await loginAdmin("admin");

      expect(result).toEqual({ success: false });
      expect(mockCookieSet).not.toHaveBeenCalled();
    });

    it("[P2] 8.1-UNIT-012: loginAdmin falls back to default 'admin' password in non-production", async () => {
      process.env.NODE_ENV = "development";
      delete process.env.ADMIN_PASSWORD;

      const result = await loginAdmin("admin");

      expect(result).toEqual({ success: true });
      expect(mockCookieSet).toHaveBeenCalledWith("admin_session", "admin", {
        httpOnly: true,
        secure: false,
        maxAge: 60 * 60 * 24,
        path: "/",
      });
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

