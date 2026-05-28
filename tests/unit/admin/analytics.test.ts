/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from "vitest";

// Hoisted mocks for database client
const { mockInsert, mockSelect, mockDb } = vi.hoisted(() => {
  const mockInsert = vi.fn();
  const mockSelect = vi.fn();
  const mockDb: any = {
    insert: mockInsert,
    select: mockSelect,
  };
  return { mockInsert, mockSelect, mockDb };
});

vi.mock("@/lib/db/client", () => ({
  db: mockDb,
}));

// Mock admin auth
const { mockVerifyAdminAuth } = vi.hoisted(() => ({
  mockVerifyAdminAuth: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  verifyAdminAuth: mockVerifyAdminAuth,
}));

describe.skip("Story 8.7: Shortlist Analytics - Unit Tests (ATDD RED)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("API Endpoint: POST /api/shortlist/events", () => {
    it("[P0] should record valid save/unsave anonymous events without storing PII (AC1, AC6)", async () => {
      // Given a valid shortlist event request body
      const mockRequestBody = {
        propertyId: "00000000-0000-0000-0000-000000000001",
        action: "save",
        locale: "en",
      };

      // Mock property exists check
      const mockLimit = vi.fn().mockResolvedValue([{ id: mockRequestBody.propertyId }]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const mockInsertValues = vi.fn().mockResolvedValue({ success: true });
      mockInsert.mockReturnValue({ values: mockInsertValues });

      // @ts-expect-error - POST handler is not yet created
      const { POST } = await import("@/app/api/shortlist/events/route");

      const request = new Request("http://localhost/api/shortlist/events", {
        method: "POST",
        body: JSON.stringify(mockRequestBody),
      });

      // When called
      const response = await POST(request);
      const data = await response.json();

      // Then it should return 201 Created and succeed
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);

      // And it should have verified the property exists
      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();

      // And inserted into shortlist_events table without PII data (IP, finger-print, session IDs)
      expect(mockInsert).toHaveBeenCalled();
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyId: mockRequestBody.propertyId,
          action: "save",
          locale: "en",
        })
      );
      
      // Ensure no PII keys exist in the inserted payload
      const insertedKeys = Object.keys(mockInsertValues.mock.calls[0][0]);
      expect(insertedKeys).not.toContain("ipAddress");
      expect(insertedKeys).not.toContain("fingerprint");
      expect(insertedKeys).not.toContain("cookieId");
    });

    it("[P1] should return 400 Bad Request when request input validation fails (Zod) (AC1)", async () => {
      // Given an invalid request body (missing fields)
      const mockRequestBody = {
        propertyId: "not-a-uuid",
        action: "invalid-action",
      };

      // @ts-expect-error - POST handler is not yet created
      const { POST } = await import("@/app/api/shortlist/events/route");

      const request = new Request("http://localhost/api/shortlist/events", {
        method: "POST",
        body: JSON.stringify(mockRequestBody),
      });

      // When called
      const response = await POST(request);
      const data = await response.json();

      // Then it should return 400 Bad Request with validation errors
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("[P1] should return 404 Not Found when referenced property does not exist in DB (AC1)", async () => {
      // Given a property ID that does not exist in the properties table
      const mockRequestBody = {
        propertyId: "00000000-0000-0000-0000-999999999999",
        action: "save",
        locale: "es",
      };

      // Mock property exists check returning empty array
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      // @ts-expect-error - POST handler is not yet created
      const { POST } = await import("@/app/api/shortlist/events/route");

      const request = new Request("http://localhost/api/shortlist/events", {
        method: "POST",
        body: JSON.stringify(mockRequestBody),
      });

      // When called
      const response = await POST(request);
      const data = await response.json();

      // Then it should return 404 Not Found
      expect(response.status).toBe(404);
      expect(data.error).toBe("Property not found");
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });

  describe("Shortlist Analytics Queries: fetchShortlistAnalyticsData", () => {
    it("[P0] should compile the aggregation query with correct metrics and outer joins (AC3, AC6)", async () => {
      // Mock db.select/leftJoin/groupBy query chain
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockOffset = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockGroupBy = vi.fn().mockReturnValue({ offset: mockOffset });
      const mockLeftJoin = vi.fn().mockReturnValue({ groupBy: mockGroupBy });
      const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin });
      mockSelect.mockReturnValue({ from: mockFrom });

      // @ts-expect-error - fetchShortlistAnalyticsData query is not yet created
      const { fetchShortlistAnalyticsData } = await import("@/lib/db/queries/properties");

      // When called
      await fetchShortlistAnalyticsData({
        search: "condo",
        sortBy: "saves30",
        sortOrder: "desc",
        limit: 10,
        offset: 0,
      });

      // Then the Drizzle query builder should have built a left join aggregation
      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockLeftJoin).toHaveBeenCalled();
      expect(mockGroupBy).toHaveBeenCalled();
    });
  });

  describe("Server Action: getShortlistAnalyticsAction", () => {
    it("[P0] should fail if the caller is not authenticated as admin (AC2, AC3)", async () => {
      // Given an unauthenticated user
      mockVerifyAdminAuth.mockRejectedValue(new Error("Unauthorized"));

      // @ts-expect-error - getShortlistAnalyticsAction server action is not yet created
      const { getShortlistAnalyticsAction } = await import("@/app/actions/admin-analytics-actions");

      // When/Then it should throw an auth error
      await expect(getShortlistAnalyticsAction({})).rejects.toThrow("Unauthorized");
    });

    it("[P0] should fetch aggregated analytics when the caller is authenticated admin (AC3, AC4)", async () => {
      // Given an authenticated admin
      mockVerifyAdminAuth.mockResolvedValue(true);

      const mockQueryResult = [
        {
          id: "prop-1",
          apiId: "CR-100",
          titleEn: "Luxury Condo",
          titleEs: "Condominio de Lujo",
          totalSaves: 5,
          saves30Days: 3,
          activeSaves: 4,
        },
      ];

      // Mock database queries
      const mockLimit = vi.fn().mockResolvedValue(mockQueryResult);
      const mockOffset = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockGroupBy = vi.fn().mockReturnValue({ offset: mockOffset });
      const mockLeftJoin = vi.fn().mockReturnValue({ groupBy: mockGroupBy });
      const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin });
      mockSelect.mockReturnValue({ from: mockFrom });

      // @ts-expect-error - getShortlistAnalyticsAction server action is not yet created
      const { getShortlistAnalyticsAction } = await import("@/app/actions/admin-analytics-actions");

      // When called
      const result = await getShortlistAnalyticsAction({
        page: 1,
        limit: 10,
      });

      // Then it should return the analytics data
      expect(result).toHaveProperty("analytics");
      expect(result.analytics).toEqual(mockQueryResult);
    });
  });
});
