/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Hoisted mocks for database client and next/cache
const { mockInsert, mockSelect, mockDb, mockRevalidatePath, mockRevalidateTag } = vi.hoisted(() => {
  const mockOnConflictDoUpdate = vi.fn().mockResolvedValue({ success: true });
  const mockInsertValues = vi.fn().mockReturnValue({
    onConflictDoUpdate: mockOnConflictDoUpdate,
  });
  const mockInsert = vi.fn().mockReturnValue({
    values: mockInsertValues,
  });

  const mockLimit = vi.fn();
  const mockWhere = vi.fn().mockReturnValue({
    limit: mockLimit,
  });
  const mockFrom = vi.fn().mockReturnValue({
    where: mockWhere,
  });
  const mockSelect = vi.fn().mockReturnValue({
    from: mockFrom,
  });

  const mockDb: any = {
    insert: mockInsert,
    select: mockSelect,
  };

  const mockRevalidatePath = vi.fn();
  const mockRevalidateTag = vi.fn();

  return {
    mockInsert,
    mockSelect,
    mockDb,
    mockRevalidatePath,
    mockRevalidateTag,
    mockInsertValues,
    mockOnConflictDoUpdate,
    mockLimit,
    mockWhere,
    mockFrom,
  };
});

vi.mock("@/lib/db/client", () => ({
  db: mockDb,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
  revalidateTag: mockRevalidateTag,
}));

import { updateSettingAction, getSettingAction } from "@/app/actions/admin-settings-actions";

describe("Admin Settings Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("updateSettingAction", () => {
    it("should successfully insert/update setting and trigger revalidation", async () => {
      const result = await updateSettingAction("GTM_CONTAINER_ID", "GTM-TEST123");

      expect(mockInsert).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(mockRevalidateTag).toHaveBeenCalledWith("settings");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
    });
  });

  describe("getSettingAction", () => {
    it("should fetch setting value successfully from database", async () => {
      const mockResult = [{ key: "GTM_CONTAINER_ID", value: "GTM-TEST123" }];
      // Setup chain resolved value
      const mockLimitFn = vi.fn().mockResolvedValue(mockResult);
      const mockWhereFn = vi.fn().mockReturnValue({
        limit: mockLimitFn,
      });
      const mockFromFn = vi.fn().mockReturnValue({
        where: mockWhereFn,
      });
      mockSelect.mockReturnValue({
        from: mockFromFn,
      });

      const result = await getSettingAction("GTM_CONTAINER_ID");

      expect(mockSelect).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.value).toBe("GTM-TEST123");
    });

    it("should return null if key is not found", async () => {
      const mockLimitFn = vi.fn().mockResolvedValue([]);
      const mockWhereFn = vi.fn().mockReturnValue({
        limit: mockLimitFn,
      });
      const mockFromFn = vi.fn().mockReturnValue({
        where: mockWhereFn,
      });
      mockSelect.mockReturnValue({
        from: mockFromFn,
      });

      const result = await getSettingAction("GTM_CONTAINER_ID");

      expect(result.success).toBe(true);
      expect(result.value).toBeNull();
    });
  });
});
