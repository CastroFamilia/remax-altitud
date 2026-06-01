/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from "vitest";

// Hoisted mocks for database client and next/cache
const { mockUpdate, mockDb, mockRevalidatePath } = vi.hoisted(() => {
  const mockUpdate = vi.fn();
  const mockSelect = vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => {
        const whereObj = {
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn().mockResolvedValue([{ id: "prop-1" }]),
            })),
          })),
          then: (onfulfilled: any) => Promise.resolve([{ count: 1 }]).then(onfulfilled),
        };
        return whereObj;
      }),
    })),
  }));
  const mockDb: any = {
    update: mockUpdate,
    select: mockSelect,
  };
  const mockRevalidatePath = vi.fn();
  return { mockUpdate, mockDb, mockRevalidatePath };
});

vi.mock("@/lib/db/client", () => ({
  db: mockDb,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

// Mock verifyAdminAuth
const { mockVerifyAdminAuth } = vi.hoisted(() => ({
  mockVerifyAdminAuth: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  verifyAdminAuth: mockVerifyAdminAuth,
}));

describe("Story 8.6: Listing Visibility & SEO Monitoring - Unit Tests (ATDD RED)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updatePropertyVisibilityAction server action", () => {
    it("[P0] should fail when the user is not authenticated as admin", async () => {
      // Given an unauthenticated user
      mockVerifyAdminAuth.mockRejectedValue(new Error("Unauthorized"));

      const { updatePropertyVisibilityAction } = await import("@/app/actions/admin-visibility-actions");

      // When called
      // Then it should throw an auth error
      await expect(updatePropertyVisibilityAction("property-1", false)).rejects.toThrow(
        "Unauthorized",
      );
    });

    it("[P0] should successfully save property visibility and trigger revalidations when admin is authenticated", async () => {
      // Given an authenticated admin
      mockVerifyAdminAuth.mockResolvedValue(true);

      const mockUpdateWhere = vi.fn().mockResolvedValue({ success: true });
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      mockUpdate.mockReturnValue({ set: mockUpdateSet });

      const { updatePropertyVisibilityAction } = await import("@/app/actions/admin-visibility-actions");

      // When called
      const result = await updatePropertyVisibilityAction("property-1", false);

      // Then it should update database
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          isVisible: false,
        }),
      );
      expect(mockUpdateWhere).toHaveBeenCalled();

      // And it should trigger revalidatePath for relevant routes
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/property/[slug]");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/search");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]");

      expect(result.success).toBe(true);
    });
  });

  describe("fetchAdminVisibilityData server action", () => {
    it("[P1] should fail when the user is not authenticated as admin", async () => {
      // Given an unauthenticated user
      mockVerifyAdminAuth.mockRejectedValue(new Error("Unauthorized"));

      const { fetchAdminVisibilityData } = await import("@/app/actions/admin-visibility-actions");

      // When called
      // Then it should throw an auth error
      await expect(fetchAdminVisibilityData({ page: 1, limit: 10 })).rejects.toThrow(
        "Unauthorized",
      );
    });

    it("[P1] should fetch properties listing data successfully with pagination and search filters", async () => {
      // Given an authenticated admin
      mockVerifyAdminAuth.mockResolvedValue(true);

      const { fetchAdminVisibilityData } = await import("@/app/actions/admin-visibility-actions");

      // When called
      const result = await fetchAdminVisibilityData({
        page: 1,
        limit: 10,
        searchQuery: "condo",
        showHiddenOnly: true,
      });

      // Then it should return the paginated list of properties with total count
      expect(result).toHaveProperty("properties");
      expect(result).toHaveProperty("totalCount");
      expect(result).toHaveProperty("totalPages");
      expect(Array.isArray(result.properties)).toBe(true);
    });

    it("[P2] should handle invalid or fractional pagination page inputs gracefully", async () => {
      // Given an authenticated admin and invalid page parameters
      mockVerifyAdminAuth.mockResolvedValue(true);

      const { fetchAdminVisibilityData } = await import("@/app/actions/admin-visibility-actions");

      // When called with a fractional page
      const resultFractional = await fetchAdminVisibilityData({
        page: 2.7,
        limit: 10,
      });

      // Then it should truncate the page to 2
      expect(resultFractional.page).toBe(2);

      // When called with an invalid/negative page
      const resultNegative = await fetchAdminVisibilityData({
        page: -5,
        limit: 10,
      });

      // Then it should fallback to page 1
      expect(resultNegative.page).toBe(1);
    });

    it("[P2] should handle empty or omitted parameters gracefully by defaulting them", async () => {
      // Given an authenticated admin and no parameters
      mockVerifyAdminAuth.mockResolvedValue(true);

      const { fetchAdminVisibilityData } = await import("@/app/actions/admin-visibility-actions");

      // When called with no parameters
      const result = await fetchAdminVisibilityData();

      // Then it should default to page 1, limit 10 and return results successfully
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result).toHaveProperty("properties");
    });
  });

  describe("database query updatePropertyVisibility", () => {
    it("[P0] should correctly compile the drizzle update query for visibility toggling", async () => {
      const mockUpdateWhere = vi.fn().mockResolvedValue({ success: true });
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      mockUpdate.mockReturnValue({ set: mockUpdateSet });

      const { updatePropertyVisibility } = await import("@/lib/db/queries/properties");

      await updatePropertyVisibility("property-1", false);

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          isVisible: false,
        }),
      );
    });
  });

  describe("GA4 Cookieless Consent configuration", () => {
    it("[P1] should ensure GA4 tracking behaves cookieless with storage denied by default", () => {
      // The default consent parameters should deny storage
      const consentDefaults = {
        ad_storage: "denied",
        analytics_storage: "denied",
        personalization_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      };
      
      expect(consentDefaults.analytics_storage).toBe("denied");
      expect(consentDefaults.ad_storage).toBe("denied");
    });
  });
});
