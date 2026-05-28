import { vi, describe, it, expect, beforeEach } from "vitest";

// Hoisted mocks for database client and next/cache
const { mockUpdate, mockDb, mockRevalidatePath } = vi.hoisted(() => {
  const mockUpdate = vi.fn();
  const mockDb = {
    update: mockUpdate,
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

describe.skip("Story 8.4: Lifestyle Tag Administration - Unit Tests (TDD RED PHASE)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updatePropertyTagsAction server action", () => {
    it("should fail when the user is not authenticated as admin", async () => {
      // Given an unauthenticated user
      mockVerifyAdminAuth.mockRejectedValue(new Error("Unauthorized"));

      const { updatePropertyTagsAction } = await import("@/app/actions/admin-tag-actions");

      // When called
      // Then it should throw an auth error
      await expect(updatePropertyTagsAction("property-1", ["investment-property"])).rejects.toThrow("Unauthorized");
    });

    it("should successfully save property tags and trigger revalidations when admin is authenticated", async () => {
      // Given an authenticated admin
      mockVerifyAdminAuth.mockResolvedValue(true);

      const mockUpdateWhere = vi.fn().mockResolvedValue({ success: true });
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      mockUpdate.mockReturnValue({ set: mockUpdateSet });

      const { updatePropertyTagsAction } = await import("@/app/actions/admin-tag-actions");

      // When called
      const result = await updatePropertyTagsAction("property-1", ["investment-property"]);

      // Then it should update database
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          lifestyleTags: ["investment-property"],
        })
      );
      expect(mockUpdateWhere).toHaveBeenCalled();

      // And it should trigger revalidatePath for relevant routes
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/properties/[slug]");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/search");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]");

      expect(result.success).toBe(true);
    });
  });

  describe("database query updatePropertyTags", () => {
    it("should correctly compile the drizzle update query for lifestyle tags array", async () => {
      const mockUpdateWhere = vi.fn().mockResolvedValue({ success: true });
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      mockUpdate.mockReturnValue({ set: mockUpdateSet });

      const { updatePropertyTags } = await import("@/lib/db/queries/properties");

      await updatePropertyTags("property-1", ["investment-property"]);

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          lifestyleTags: ["investment-property"],
        })
      );
    });
  });
});
