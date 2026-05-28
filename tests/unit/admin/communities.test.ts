import { vi, describe, it, expect, beforeEach } from "vitest";

// Hoisted mocks for database client and next/cache
const { mockInsert, mockUpdate, mockDelete, mockSelect, mockDb, mockRevalidatePath } = vi.hoisted(() => {
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockSelect = vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn().mockResolvedValue([{ id: "community-1", name: "Reserva Conchal" }]),
      })),
    })),
  }));
  const mockDb: any = {
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    select: mockSelect,
  };
  mockDb.transaction = vi.fn((cb) => cb(mockDb));
  const mockRevalidatePath = vi.fn();
  return { mockInsert, mockUpdate, mockDelete, mockSelect, mockDb, mockRevalidatePath };
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

describe("Story 8.5: Community Administration - Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCommunityAction server action", () => {
    it("should fail when the user is not authenticated as admin", async () => {
      // Given an unauthenticated user
      mockVerifyAdminAuth.mockRejectedValue(new Error("Unauthorized"));

      const { createCommunityAction } = await import("@/app/actions/admin-community-actions");

      // When called
      const result = await createCommunityAction({
        name: "Test Community",
        slug: "test-community",
        areaId: "area-1",
        taglineEn: "Tagline EN",
        taglineEs: "Tagline ES",
        descriptionEn: "Description EN",
        descriptionEs: "Description ES",
        heroImageUrl: "http://example.com/hero.jpg",
        latitude: 9.93,
        longitude: -84.15,
        geoFence: [[-84.15, 9.93], [-84.16, 9.94], [-84.15, 9.93]],
        geoFenceCoords: { type: "Polygon", coordinates: [[[-84.15, 9.93], [-84.16, 9.94], [-84.15, 9.93]]] },
        quickFacts: {
          elevation: "1000m",
          airportDistance: "30 mins",
          internet: "Fiber",
          amenities: "Pool, Gym",
          developer: "Developer Co",
          established: "2020",
        },
        siteMapImageUrl: "http://example.com/sitemap.jpg",
      });

      // Then it should return success: false and error: Unauthorized
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("should successfully insert community and trigger revalidations when admin is authenticated", async () => {
      // Given an authenticated admin
      mockVerifyAdminAuth.mockResolvedValue(true);

      const mockReturning = vi.fn().mockResolvedValue([{ id: "community-1", name: "Test Community" }]);
      const mockInsertValues = vi.fn().mockReturnValue({ returning: mockReturning });
      mockInsert.mockReturnValue({ values: mockInsertValues });

      const { createCommunityAction } = await import("@/app/actions/admin-community-actions");

      // When called
      const result = await createCommunityAction({
        name: "Test Community",
        slug: "test-community",
        areaId: "area-1",
        taglineEn: "Tagline EN",
        taglineEs: "Tagline ES",
        descriptionEn: "Description EN",
        descriptionEs: "Description ES",
        heroImageUrl: "http://example.com/hero.jpg",
        latitude: 9.93,
        longitude: -84.15,
        geoFence: [[-84.15, 9.93], [-84.16, 9.94], [-84.15, 9.93]],
        geoFenceCoords: { type: "Polygon", coordinates: [[[-84.15, 9.93], [-84.16, 9.94], [-84.15, 9.93]]] },
        quickFacts: {
          elevation: "1000m",
          airportDistance: "30 mins",
          internet: "Fiber",
          amenities: "Pool, Gym",
          developer: "Developer Co",
          established: "2020",
        },
        siteMapImageUrl: "http://example.com/sitemap.jpg",
      });

      // Then it should insert into database
      expect(mockInsert).toHaveBeenCalled();
      expect(mockInsertValues).toHaveBeenCalled();

      // And it should trigger revalidatePath for relevant routes
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/communities");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/areas/[slug]");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/search");

      expect(result.success).toBe(true);
    });
  });

  describe("updateCommunityAction server action", () => {
    it("should successfully update community and trigger revalidations when admin is authenticated", async () => {
      // Given an authenticated admin
      mockVerifyAdminAuth.mockResolvedValue(true);

      const mockReturning = vi.fn().mockResolvedValue([{ id: "community-1", name: "Updated Community Name" }]);
      const mockUpdateWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      mockUpdate.mockReturnValue({ set: mockUpdateSet });

      const { updateCommunityAction } = await import("@/app/actions/admin-community-actions");

      // When called
      const result = await updateCommunityAction("community-1", {
        name: "Updated Community Name",
      });

      // Then it should update database
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalled();
      expect(mockUpdateWhere).toHaveBeenCalled();

      // And trigger revalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/communities");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/areas/[slug]");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/areas/[slug]/communities/[communitySlug]");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/search");

      expect(result.success).toBe(true);
    });
  });

  describe("deleteCommunityAction server action", () => {
    it("should successfully delete community and trigger revalidations when admin is authenticated", async () => {
      // Given an authenticated admin
      mockVerifyAdminAuth.mockResolvedValue(true);

      const mockDeleteWhere = vi.fn().mockResolvedValue({ success: true });
      mockDelete.mockReturnValue({ where: mockDeleteWhere });

      const { deleteCommunityAction } = await import("@/app/actions/admin-community-actions");

      // When called
      const result = await deleteCommunityAction("community-1");

      // Then it should delete from database
      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteWhere).toHaveBeenCalled();

      // And trigger revalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/communities");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/areas/[slug]");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/search");

      expect(result.success).toBe(true);
    });
  });

  describe("updatePropertyCommunityAction server action", () => {
    it("should successfully override property community and trigger revalidation", async () => {
      // Given an authenticated admin
      mockVerifyAdminAuth.mockResolvedValue(true);

      const mockUpdateWhere = vi.fn().mockResolvedValue({ success: true });
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      mockUpdate.mockReturnValue({ set: mockUpdateSet });

      const { updatePropertyCommunityAction } = await import("@/app/actions/admin-community-actions");

      // When called
      const result = await updatePropertyCommunityAction("property-1", "community-1");

      // Then it should update property in database
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          communityId: "community-1",
        })
      );
      expect(mockUpdateWhere).toHaveBeenCalled();

      // And trigger property path revalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/properties/[slug]");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/search");

      expect(result.success).toBe(true);
    });
  });

  describe("database query CRUD", () => {
    it("should correctly compile Drizzle insert query for createCommunity", async () => {
      const mockReturning = vi.fn().mockResolvedValue([{ id: "community-1" }]);
      const mockInsertValues = vi.fn().mockReturnValue({ returning: mockReturning });
      mockInsert.mockReturnValue({ values: mockInsertValues });

      const { createCommunity } = await import("@/lib/db/queries/communities");

      await createCommunity({
        name: "Test Community",
        slug: "test-community",
        areaId: "area-1",
        taglineEn: "Tagline EN",
        taglineEs: "Tagline ES",
        descriptionEn: "Description EN",
        descriptionEs: "Description ES",
        heroImageUrl: "http://example.com/hero.jpg",
        latitude: 9.93,
        longitude: -84.15,
        geoFence: [[-84.15, 9.93], [-84.16, 9.94], [-84.15, 9.93]],
        geoFenceCoords: { type: "Polygon", coordinates: [[[-84.15, 9.93], [-84.16, 9.94], [-84.15, 9.93]]] },
        quickFacts: {
          elevation: "1000m",
          airportDistance: "30 mins",
          internet: "Fiber",
          amenities: "Pool, Gym",
          developer: "Developer Co",
          established: "2020",
        },
        siteMapImageUrl: "http://example.com/sitemap.jpg",
      });

      expect(mockInsert).toHaveBeenCalled();
      expect(mockInsertValues).toHaveBeenCalled();
    });

    it("should correctly compile Drizzle update query for updatePropertyCommunity", async () => {
      const mockUpdateWhere = vi.fn().mockResolvedValue({ success: true });
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      mockUpdate.mockReturnValue({ set: mockUpdateSet });

      const { updatePropertyCommunity } = await import("@/lib/db/queries/properties");

      await updatePropertyCommunity("property-1", "community-1");

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          communityId: "community-1",
        })
      );
    });
  });
});
