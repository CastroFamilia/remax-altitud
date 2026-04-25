/**
 * Story 2.3: Sync Pipeline Core — Error Handling & Edge Cases
 * Module: src/lib/sync/pipeline.ts
 *
 * Covers AC #6 (soft-delete), AC #8 (listing counts ordering),
 * AC #10 (failure status), AC #11 (partial status), AC #12 (lot size warning),
 * AC #14 (revalidation best-effort), AC #15 (empty office).
 *
 * All external dependencies are mocked — no live DB or API calls.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock all external dependencies before importing the module under test
// ---------------------------------------------------------------------------

vi.mock("@/lib/sync/api-client", () => ({
  fetchPropertiesForOffice: vi.fn(),
  fetchAgentsForOffice: vi.fn(),
}));

vi.mock("@/lib/sync/differ", () => ({
  computePropertyHash: vi.fn(),
  diffProperties: vi.fn(),
}));

vi.mock("@/lib/db/queries/sync-log", () => ({
  createSyncLog: vi.fn(),
  updateSyncLog: vi.fn(),
}));

vi.mock("@/lib/db/queries/properties", () => ({
  upsertProperty: vi.fn(),
  softDeleteProperties: vi.fn(),
  fetchPropertySnapshot: vi.fn(),
  fetchOfficeIdMap: vi.fn(),
  fetchAgentIdMap: vi.fn(),
  updatePropertyImages: vi.fn(),
}));

vi.mock("@/lib/db/queries/agents", () => ({
  upsertAgent: vi.fn(),
  updateAgentListingCounts: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  db: { select: vi.fn() },
}));

// Mock the image optimizer — prevents real sharp/fetch calls in pipeline tests
vi.mock("@/lib/sync/image-optimizer", () => ({
  optimizePropertyImages: vi.fn().mockResolvedValue({ optimized: [], errors: [] }),
}));

// ---------------------------------------------------------------------------
// Imports — resolved after mocks are hoisted
// ---------------------------------------------------------------------------

import { runSyncPipeline } from "@/lib/sync/pipeline";
import { fetchPropertiesForOffice, fetchAgentsForOffice } from "@/lib/sync/api-client";
import { diffProperties } from "@/lib/sync/differ";
import { createSyncLog, updateSyncLog } from "@/lib/db/queries/sync-log";
import {
  upsertProperty,
  softDeleteProperties,
  fetchPropertySnapshot,
  fetchOfficeIdMap,
  fetchAgentIdMap,
  updatePropertyImages,
} from "@/lib/db/queries/properties";
import { upsertAgent, updateAgentListingCounts } from "@/lib/db/queries/agents";
import { optimizePropertyImages } from "@/lib/sync/image-optimizer";
import { makeRawProperty, makeRawAgent, makeSyncLog } from "./factories";

// ---------------------------------------------------------------------------
// Env setup / teardown
// ---------------------------------------------------------------------------

const ENV_KEYS = [
  "CRON_SECRET",
  "API_SECRET",
  "NEXTAUTH_URL",
  "REMAX_API_BASE_URL",
  "PZ_OFFICE_GUID",
  "DOM_OFFICE_GUID",
] as const;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
  process.env.REMAX_API_BASE_URL = "https://api.remax-cca.example/api";
  process.env.PZ_OFFICE_GUID = "FEA8746D-CC1D-41B8-89F3-D04AC98274AF";
  process.env.DOM_OFFICE_GUID = "4AD5AE8F-5B47-4A1A-A953-40445F2B4940";
  process.env.CRON_SECRET = "test-cron-secret";
  process.env.API_SECRET = "test-api-secret";
  process.env.NEXTAUTH_URL = "http://localhost:3000";

  vi.clearAllMocks();

  vi.mocked(fetchPropertySnapshot).mockResolvedValue([]);
  vi.mocked(fetchOfficeIdMap).mockResolvedValue(
    new Map([
      ["FEA8746D-CC1D-41B8-89F3-D04AC98274AF", "office-uuid-pz"],
      ["4AD5AE8F-5B47-4A1A-A953-40445F2B4940", "office-uuid-dom"],
    ]),
  );
  vi.mocked(fetchAgentIdMap).mockResolvedValue(new Map([["2400", "agent-uuid-1"]]));
  vi.mocked(updatePropertyImages).mockResolvedValue(undefined);
  vi.mocked(optimizePropertyImages).mockResolvedValue({ optimized: [], errors: [] });

  global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 } as Response);
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Error and edge-case paths
// ---------------------------------------------------------------------------

describe("runSyncPipeline — error handling", () => {
  it("[P0] updates sync_log to status='failure' when an uncaught exception is thrown", async () => {
    // AC #10 — on uncaught error, log must record failure before re-throwing
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);
    vi.mocked(updateSyncLog).mockResolvedValue(undefined);

    vi.mocked(fetchPropertiesForOffice).mockRejectedValue(new Error("Network timeout"));
    vi.mocked(fetchAgentsForOffice).mockRejectedValue(new Error("Network timeout"));

    await expect(runSyncPipeline()).rejects.toThrow("Network timeout");

    expect(updateSyncLog).toHaveBeenCalledWith(
      syncLog.id,
      expect.objectContaining({
        status: "failure",
        errorMessage: expect.stringContaining("Network timeout"),
        completedAt: expect.any(Date),
      }),
    );
  });

  it("[P0] sets status='partial' when some records fail Zod validation (pipeline continues)", async () => {
    // AC #11 — parse errors → partial status, pipeline does not crash
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

    const validProp = makeRawProperty({ apiId: "VALID-1" });
    const parseErrors = [
      { apiId: "INVALID-1", scope: "property" as const, message: "Invalid ListingId", raw: {} },
    ];

    vi.mocked(fetchPropertiesForOffice)
      .mockResolvedValueOnce({ records: [validProp], parseErrors })
      .mockResolvedValueOnce({ records: [], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(diffProperties).mockReturnValue({
      new: [validProp],
      updated: [],
      unchanged: [],
      removed: [],
    });
    vi.mocked(upsertProperty).mockResolvedValue(undefined);
    vi.mocked(softDeleteProperties).mockResolvedValue(0);
    vi.mocked(updateAgentListingCounts).mockResolvedValue(undefined);
    vi.mocked(updateSyncLog).mockResolvedValue(undefined);

    await runSyncPipeline();

    // AC #11 — status must be "partial" when any parse errors exist
    expect(updateSyncLog).toHaveBeenCalledWith(
      syncLog.id,
      expect.objectContaining({
        status: "partial",
        errors: expect.arrayContaining([
          expect.objectContaining({ apiId: "INVALID-1", scope: "property" }),
        ]),
      }),
    );
  });

  it("[P0] completes successfully when Altitud Cero returns [] for properties", async () => {
    // AC #15, API8 — empty office must not crash the pipeline
    // Risk R-010: empty Altitud Cero must be a no-op
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

    vi.mocked(fetchPropertiesForOffice)
      .mockResolvedValueOnce({ records: [makeRawProperty()], parseErrors: [] }) // PZ
      .mockResolvedValueOnce({ records: [], parseErrors: [] }); // DOM (Altitud Cero = empty)
    vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(diffProperties).mockReturnValue({
      new: [makeRawProperty()],
      updated: [],
      unchanged: [],
      removed: [],
    });
    vi.mocked(upsertProperty).mockResolvedValue(undefined);
    vi.mocked(softDeleteProperties).mockResolvedValue(0);
    vi.mocked(updateAgentListingCounts).mockResolvedValue(undefined);
    vi.mocked(updateSyncLog).mockResolvedValue(undefined);

    const result = await runSyncPipeline();

    expect(updateSyncLog).toHaveBeenCalledWith(
      syncLog.id,
      expect.objectContaining({ status: "success" }),
    );
    expect(result).toBeDefined();
  });

  it("[P1] records lotSizeUnitWarning entries in sync_log.errors without blocking the upsert", async () => {
    // AC #12 — lot size warnings are recorded as errors but do not block the sync
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

    const warningProp = makeRawProperty({ apiId: "LOT-WARN-1", lotSizeUnitWarning: true });

    vi.mocked(fetchPropertiesForOffice)
      .mockResolvedValueOnce({ records: [warningProp], parseErrors: [] })
      .mockResolvedValueOnce({ records: [], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(diffProperties).mockReturnValue({
      new: [warningProp],
      updated: [],
      unchanged: [],
      removed: [],
    });
    vi.mocked(upsertProperty).mockResolvedValue(undefined);
    vi.mocked(softDeleteProperties).mockResolvedValue(0);
    vi.mocked(updateAgentListingCounts).mockResolvedValue(undefined);
    vi.mocked(updateSyncLog).mockResolvedValue(undefined);

    await runSyncPipeline();

    // The warning property IS still upserted
    expect(upsertProperty).toHaveBeenCalled();
    expect(vi.mocked(upsertProperty).mock.calls[0][0]).toMatchObject({ apiId: "LOT-WARN-1" });

    // The warning is appended to errors JSONB
    expect(updateSyncLog).toHaveBeenCalledWith(
      syncLog.id,
      expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            apiId: "LOT-WARN-1",
            scope: expect.stringMatching(/lot_size_warning/i),
          }),
        ]),
      }),
    );
  });

  it("[P1] does NOT fail the overall sync if /api/revalidate returns a non-2xx response", async () => {
    // AC #14 — revalidation is best-effort; failure must not crash the pipeline
    // AR6: revalidation failure logs a warning, sync data is already persisted
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);
    vi.mocked(fetchPropertiesForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(diffProperties).mockReturnValue({ new: [], updated: [], unchanged: [], removed: [] });
    vi.mocked(softDeleteProperties).mockResolvedValue(0);
    vi.mocked(updateAgentListingCounts).mockResolvedValue(undefined);
    vi.mocked(updateSyncLog).mockResolvedValue(undefined);

    // Simulate revalidate endpoint returning 500
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);

    // Pipeline must still complete successfully despite revalidation failure
    await expect(runSyncPipeline()).resolves.not.toThrow();

    expect(updateSyncLog).toHaveBeenCalledWith(
      syncLog.id,
      expect.objectContaining({ status: "success" }),
    );
  });

  it("[P1] soft-deletes REMOVED apiIds after diff", async () => {
    // AC #6 — listings absent from API → is_visible=false (no hard delete)
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);
    vi.mocked(fetchPropertiesForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(diffProperties).mockReturnValue({
      new: [],
      updated: [],
      unchanged: [],
      removed: ["GONE-1", "GONE-2"],
    });
    vi.mocked(softDeleteProperties).mockResolvedValue(2);
    vi.mocked(updateAgentListingCounts).mockResolvedValue(undefined);
    vi.mocked(updateSyncLog).mockResolvedValue(undefined);

    await runSyncPipeline();

    expect(softDeleteProperties).toHaveBeenCalledWith(["GONE-1", "GONE-2"]);
    expect(updateSyncLog).toHaveBeenCalledWith(
      syncLog.id,
      expect.objectContaining({ propertiesRemoved: 2 }),
    );
  });

  it("[P1] updates agent listing_count after property upserts complete", async () => {
    // AC #8 — denormalized listing_count updated after property upserts
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

    const agent = makeRawAgent();
    vi.mocked(fetchPropertiesForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice)
      .mockResolvedValueOnce({ records: [agent], parseErrors: [] })
      .mockResolvedValueOnce({ records: [], parseErrors: [] });
    vi.mocked(diffProperties).mockReturnValue({ new: [], updated: [], unchanged: [], removed: [] });
    vi.mocked(softDeleteProperties).mockResolvedValue(0);
    vi.mocked(upsertAgent).mockResolvedValue(undefined);
    vi.mocked(updateAgentListingCounts).mockResolvedValue(undefined);
    vi.mocked(updateSyncLog).mockResolvedValue(undefined);

    await runSyncPipeline();

    expect(upsertAgent).toHaveBeenCalledTimes(1);
    expect(updateAgentListingCounts).toHaveBeenCalledOnce();

    // updateAgentListingCounts must come AFTER upsertAgent
    const agentUpsertOrder = vi.mocked(upsertAgent).mock.invocationCallOrder[0];
    const countUpdateOrder = vi.mocked(updateAgentListingCounts).mock.invocationCallOrder[0];
    expect(agentUpsertOrder).toBeLessThan(countUpdateOrder);
  });
});
