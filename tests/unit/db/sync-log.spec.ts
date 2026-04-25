/**
 * ATDD Red-Phase Scaffolds — Story 2.3: Sync Pipeline Core
 * Module: src/lib/db/queries/sync-log.ts
 *
 * TDD RED PHASE — all tests are skipped until the module is implemented.
 * Covers AC #1, #9, #10, #11 (sync_log lifecycle) + Risk R-011.
 *
 * DB calls are mocked via vi.mock — no live DATABASE_URL required.
 *
 * To activate: remove `it.skip` → `it` after implementing src/lib/db/queries/sync-log.ts
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Drizzle client before any module under test is imported.
vi.mock("@/lib/db/client", () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

import { createSyncLog, updateSyncLog } from "@/lib/db/queries/sync-log";
import type { SyncLog } from "@/lib/db/schema/sync-logs";
import { db } from "@/lib/db/client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal SyncLog-shaped object returned by mocked insert */
function makeSyncLogRow(overrides: Partial<SyncLog> = {}): SyncLog {
  return {
    id: "uuid-1234",
    status: "running",
    startedAt: new Date("2026-04-25T12:00:00Z"),
    completedAt: null,
    propertiesFetched: 0,
    propertiesCreated: 0,
    propertiesUpdated: 0,
    propertiesRemoved: 0,
    agentsSynced: 0,
    errors: [],
    errorMessage: null,
    ...overrides,
  } as SyncLog;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// createSyncLog
// ---------------------------------------------------------------------------
describe("createSyncLog", () => {
  it("[P0] inserts a row with status='running' and returns the created row", async () => {
    // AC #1 — sync_log record created with status "running" BEFORE any API call
    // Risk R-011: sync log must be created at pipeline start
    const row = makeSyncLogRow();

    // Mock the Drizzle insert chain: insert(...).values(...).returning()
    const mockReturning = vi.fn().mockResolvedValue([row]);
    const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
    vi.mocked(db.insert).mockReturnValue({ values: mockValues } as never);

    const result = await createSyncLog();

    expect(db.insert).toHaveBeenCalledOnce();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "running",
        propertiesFetched: 0,
        propertiesCreated: 0,
        propertiesUpdated: 0,
        propertiesRemoved: 0,
        agentsSynced: 0,
        errors: [],
      }),
    );
    expect(result).toEqual(row);
    expect(result.id).toBe("uuid-1234");
    expect(result.status).toBe("running");
  });

  it("[P0] includes startedAt=now() when inserting", async () => {
    // AC #1 — startedAt must be set to the current time
    const before = new Date();
    const row = makeSyncLogRow({ startedAt: new Date() });

    const mockReturning = vi.fn().mockResolvedValue([row]);
    const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
    vi.mocked(db.insert).mockReturnValue({ values: mockValues } as never);

    await createSyncLog();

    const inserted = mockValues.mock.calls[0][0] as { startedAt: Date };
    expect(inserted.startedAt).toBeInstanceOf(Date);
    expect(inserted.startedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});

// ---------------------------------------------------------------------------
// updateSyncLog
// ---------------------------------------------------------------------------
describe("updateSyncLog", () => {
  it("[P0] updates the sync_log row to status='success' with counts", async () => {
    // AC #9 — on successful completion, update log with counts
    const mockWhere = vi.fn().mockResolvedValue(undefined);
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    vi.mocked(db.update).mockReturnValue({ set: mockSet } as never);

    await updateSyncLog("uuid-1234", {
      status: "success",
      completedAt: new Date(),
      propertiesFetched: 10,
      propertiesCreated: 3,
      propertiesUpdated: 5,
      propertiesRemoved: 2,
      agentsSynced: 4,
    });

    expect(db.update).toHaveBeenCalledOnce();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        propertiesFetched: 10,
        propertiesCreated: 3,
        propertiesUpdated: 5,
        propertiesRemoved: 2,
        agentsSynced: 4,
      }),
    );
    // WHERE clause targets the correct row by id
    expect(mockWhere).toHaveBeenCalledOnce();
  });

  it("[P0] updates the sync_log row to status='failure' with errorMessage", async () => {
    // AC #10 — on uncaught exception, log must record failure
    const mockWhere = vi.fn().mockResolvedValue(undefined);
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    vi.mocked(db.update).mockReturnValue({ set: mockSet } as never);

    await updateSyncLog("uuid-1234", {
      status: "failure",
      errorMessage: "Connection refused",
      completedAt: new Date(),
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failure",
        errorMessage: "Connection refused",
      }),
    );
  });

  it("[P1] updates the sync_log row to status='partial' when parse errors occurred", async () => {
    // AC #11 — partial status when some records fail Zod validation but overall run succeeded
    const mockWhere = vi.fn().mockResolvedValue(undefined);
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    vi.mocked(db.update).mockReturnValue({ set: mockSet } as never);

    const errors = [
      { apiId: "BAD-1", scope: "property", message: "Invalid ListingId", raw: {} },
    ];

    await updateSyncLog("uuid-1234", {
      status: "partial",
      errors,
      propertiesFetched: 5,
      propertiesCreated: 4,
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "partial",
        errors,
      }),
    );
  });

  it("[P1] only updates provided fields (partial patch)", async () => {
    // AC #9 — updateSyncLog accepts Partial<NewSyncLog>
    const mockWhere = vi.fn().mockResolvedValue(undefined);
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    vi.mocked(db.update).mockReturnValue({ set: mockSet } as never);

    await updateSyncLog("uuid-1234", { status: "success" });

    // Only the status field should be in the patch
    const patch = mockSet.mock.calls[0][0] as Record<string, unknown>;
    expect(patch.status).toBe("success");
    // propertiesCreated should NOT be explicitly set to 0 — not passed in patch
    expect("propertiesCreated" in patch).toBe(false);
  });
});
