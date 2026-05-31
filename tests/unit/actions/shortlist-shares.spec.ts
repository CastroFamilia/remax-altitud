/**
 * Story 7.3: Shareable Shortlist URL — Server Actions & API Unit Tests
 * Module: src/app/actions/shortlist-actions.ts or src/lib/db/queries/shortlists.ts
 *
 * Covers:
 *   - AC #3: Stores share_id, property_ids, locale, created_at, expires_at (30 days).
 *   - AC #4: Expiration handling (returns expired status when opened after 30 days).
 *   - AC #7: Validates that all property IDs exist and are currently visible.
 *
 * DB calls are mocked via vi.mock — no live DATABASE_URL required.
 * Marked with describe.skip for the TDD RED phase.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mocks for Drizzle client
const { mockWhere, mockFrom, mockSelect, mockInsert, mockValues, mockReturning } = vi.hoisted(() => {
  const mockWhere = vi.fn().mockResolvedValue([]);
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
  const mockValues = vi.fn().mockResolvedValue([]);
  const mockReturning = vi.fn().mockImplementation(() => mockValues());
  const mockInsert = vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: mockReturning,
    }),
  });
  return { mockWhere, mockFrom, mockSelect, mockInsert, mockValues, mockReturning };
});

vi.mock("@/lib/db/client", () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
  },
}));

// We mock the database models/schemas to prevent import errors during TDD Red phase
vi.mock("drizzle-orm", () => {
  return {
    eq: vi.fn(),
    and: vi.fn(),
    inArray: vi.fn(),
    or: vi.fn(),
    sql: vi.fn(),
  };
});

vi.mock("@/lib/db/schema", () => ({
  properties: {
    id: "id",
    isVisible: "isVisible",
  },
  shortlistShares: {
    id: "id",
    shareId: "shareId",
    propertyIds: "propertyIds",
    locale: "locale",
    createdAt: "createdAt",
    expiresAt: "expiresAt",
  },
}));

// Placeholder functions for the Server Actions under test
// (Since we are in TDD RED phase, these are imported or defined as placeholders)
import { createShortlistShare, getSharedShortlist } from "@/app/actions/shortlist-actions";

describe("Story 7.3: Shareable Shortlist URL Server Actions Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockResolvedValue([]);
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });
    mockValues.mockResolvedValue([]);
    mockReturning.mockImplementation(() => mockValues());
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: mockReturning,
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("[P0] 7.3-UNIT-001: should fail to create a share if any property ID does not exist or is not visible (AC #7)", async () => {
    // Mock that DB returns only 1 property when 2 are requested (one is missing or hidden)
    mockWhere.mockResolvedValueOnce([{ id: "prop-1", isVisible: true }]);

    await expect(
      createShortlistShare({ propertyIds: ["prop-1", "prop-2"], locale: "en" })
    ).rejects.toThrow("One or more properties are invalid or hidden");

    expect(mockSelect).toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("[P0] 7.3-UNIT-002: should successfully create a shortlist share and store correct fields (AC #3)", async () => {
    // Mock that all requested properties are found and visible in the DB
    mockWhere.mockResolvedValueOnce([
      { id: "prop-1", isVisible: true },
      { id: "prop-2", isVisible: true },
    ]);

    // Mock successful insert
    const fakeShareRecord = {
      shareId: "abc123ef",
      propertyIds: ["prop-1", "prop-2"],
      locale: "en",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days TTL
    };
    mockValues.mockResolvedValueOnce([fakeShareRecord]);

    const result = await createShortlistShare({
      propertyIds: ["prop-1", "prop-2"],
      locale: "en",
    });

    expect(mockSelect).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalled();
    expect(result.shareId).toBe("abc123ef");
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now() + 29 * 24 * 60 * 60 * 1000);
  });

  it("[P0] 7.3-UNIT-002b: should successfully create a shortlist share and deduplicate input property IDs (AC #3, AC #7)", async () => {
    // Mock that DB returns only the unique property
    mockWhere.mockResolvedValueOnce([
      { id: "prop-1", isVisible: true },
    ]);

    // Mock successful insert
    const fakeShareRecord = {
      shareId: "abc123ef",
      propertyIds: ["prop-1"],
      locale: "en",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days TTL
    };
    mockValues.mockResolvedValueOnce([fakeShareRecord]);

    const result = await createShortlistShare({
      propertyIds: ["prop-1", "prop-1"],
      locale: "en",
    });

    expect(mockSelect).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalled();
    expect(result.shareId).toBe("abc123ef");
    expect(result.propertyIds).toEqual(["prop-1"]);
  });

  it("[P0] 7.3-UNIT-003: should return isExpired true when fetching a shortlist share older than 30 days (AC #4)", async () => {
    // Mock fetching a share record that has expired
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    mockWhere.mockResolvedValueOnce([
      {
        shareId: "expired123",
        propertyIds: ["prop-1"],
        locale: "en",
        expiresAt: expiredDate,
      },
    ]);

    const result = await getSharedShortlist("expired123");

    expect(result).not.toBeNull();
    expect(result!.isExpired).toBe(true);
    expect(result!.properties).toEqual([]);
  });

  it("[P0] 7.3-UNIT-004: should return the valid shortlist and properties when active (AC #2)", async () => {
    // Mock fetching an active share record
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days in future
    mockWhere.mockResolvedValueOnce([
      {
        shareId: "active123",
        propertyIds: ["prop-1"],
        locale: "en",
        expiresAt: futureDate,
      },
    ]);

    // Mock querying properties for "prop-1"
    mockWhere.mockResolvedValueOnce([
      {
        id: "prop-1",
        titleEn: "Coastal Villa",
        titleEs: "Villa Costera",
        priceUsd: 450000,
        isVisible: true,
      },
    ]);

    const result = await getSharedShortlist("active123");

    expect(result).not.toBeNull();
    expect(result!.isExpired).toBe(false);
    expect(result!.properties.length).toBe(1);
    expect(result!.properties[0].id).toBe("prop-1");
  });
});
