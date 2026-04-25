/**
 * ATDD Red-Phase Scaffolds — Story 2.3: Sync Pipeline Core
 * Module: src/lib/sync/pipeline.ts
 *
 * TDD RED PHASE — all tests are skipped until the module is implemented.
 * Covers AC #1-#15 (full pipeline orchestration).
 *
 * All external dependencies are mocked — no live DB or API calls.
 * Uses vi.mock hoisting to replace modules before imports are resolved.
 *
 * To activate: remove `it.skip` → `it` after implementing src/lib/sync/pipeline.ts
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
}));

vi.mock("@/lib/db/queries/agents", () => ({
  upsertAgent: vi.fn(),
  updateAgentListingCounts: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  db: {
    select: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Imports — resolved after mocks are hoisted
// ---------------------------------------------------------------------------

import { runSyncPipeline } from "@/lib/sync/pipeline";
import { fetchPropertiesForOffice, fetchAgentsForOffice } from "@/lib/sync/api-client";
import { diffProperties } from "@/lib/sync/differ";
import { createSyncLog, updateSyncLog } from "@/lib/db/queries/sync-log";
import { upsertProperty, softDeleteProperties } from "@/lib/db/queries/properties";
import { upsertAgent, updateAgentListingCounts } from "@/lib/db/queries/agents";
import { db } from "@/lib/db/client";
import type { RawProperty, RawAgent } from "@/lib/sync/parser";

// ---------------------------------------------------------------------------
// Factories for test data
// ---------------------------------------------------------------------------

function makeRawProperty(overrides: Partial<RawProperty> = {}): RawProperty {
  return {
    apiId: "113149",
    apiKey: "400142400001",
    officeId: "FEA8746D-CC1D-41B8-89F3-D04AC98274AF",
    propertyTypeEn: "Lot/Land",
    propertyTypeEs: "Lote/Terreno",
    contractTypeEn: "Sale",
    contractTypeEs: "Venta",
    titleEn: "Mountain View Land",
    titleEs: "Terreno con vista",
    publicRemarksEn: "A great land parcel.",
    publicRemarksEs: "Un buen terreno.",
    apiStatus: "Active",
    priceUsd: 199000,
    latitude: 9.3549572,
    longitude: -83.6350214,
    bedrooms: null,
    bathrooms: null,
    lotSizeM2: 14757,
    constructionM2: 0,
    images: ["https://cdn.example.com/photo1.jpg"],
    amenities: {
      garage: false, garageSpaces: 0, maidRoom: false, cooling: false,
      pool: false, view: true, gatedCommunity: false, furnished: false,
    },
    slug: null,
    videoUrl: null,
    address: "San Francisco, Perez Zeledon",
    agentFirstName: "Emma",
    agentLastName: "Bennett",
    agentId: "2400",
    isExpired: false,
    lotSizeUnitWarning: false,
    apiRaw: {},
    ...overrides,
  };
}

function makeRawAgent(overrides: Partial<RawAgent> = {}): RawAgent {
  return {
    apiId: "2400",
    firstName: "Emma",
    lastName: "Bennett",
    email: "emma@remax-altitud.cr",
    phone: "+50688887777",
    whatsapp: "+50688887777",
    role: "owner",
    primaryLang: "en",
    officeId: "FEA8746D-CC1D-41B8-89F3-D04AC98274AF",
    photoUrl: "https://cdn.example.com/emma.jpg",
    apiRaw: {},
    ...overrides,
  };
}

function makeSyncLog(overrides = {}) {
  return {
    id: "sync-log-uuid-1",
    status: "running",
    startedAt: new Date(),
    completedAt: null,
    propertiesFetched: 0,
    propertiesCreated: 0,
    propertiesUpdated: 0,
    propertiesRemoved: 0,
    agentsSynced: 0,
    errors: [],
    errorMessage: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

const ENV_KEYS = ["CRON_SECRET", "API_SECRET", "NEXTAUTH_URL", "REMAX_API_BASE_URL", "PZ_OFFICE_GUID", "DOM_OFFICE_GUID"] as const;
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

  // Default: global fetch returns a successful revalidate response
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
// Happy path
// ---------------------------------------------------------------------------

describe("runSyncPipeline — happy path", () => {
  it.skip("[P0] creates sync_log with status='running' BEFORE fetching any data", async () => {
    // AC #1 — sync_log row created as first action, before API calls
    // Risk R-011: log created before any external call
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

    const pzProp = makeRawProperty({ apiId: "P1" });
    const domProp = makeRawProperty({ apiId: "P2", officeId: "4AD5AE8F-5B47-4A1A-A953-40445F2B4940" });
    const agent = makeRawAgent();

    vi.mocked(fetchPropertiesForOffice)
      .mockResolvedValueOnce({ records: [pzProp], parseErrors: [] })
      .mockResolvedValueOnce({ records: [domProp], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice)
      .mockResolvedValueOnce({ records: [agent], parseErrors: [] })
      .mockResolvedValueOnce({ records: [], parseErrors: [] });

    // Mock DB snapshot query
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        columns: vi.fn().mockResolvedValue([]),
      }),
    } as never);

    vi.mocked(diffProperties).mockReturnValue({
      new: [pzProp, domProp],
      updated: [],
      unchanged: [],
      removed: [],
    });

    vi.mocked(upsertProperty).mockResolvedValue(undefined);
    vi.mocked(softDeleteProperties).mockResolvedValue(0);
    vi.mocked(upsertAgent).mockResolvedValue(undefined);
    vi.mocked(updateAgentListingCounts).mockResolvedValue(undefined);
    vi.mocked(updateSyncLog).mockResolvedValue(undefined);

    await runSyncPipeline();

    // createSyncLog must be called before fetchPropertiesForOffice
    const createCallOrder = vi.mocked(createSyncLog).mock.invocationCallOrder[0];
    const fetchCallOrder = vi.mocked(fetchPropertiesForOffice).mock.invocationCallOrder[0];
    expect(createCallOrder).toBeLessThan(fetchCallOrder);
  });

  it.skip("[P0] fetches all 4 endpoints in parallel (Promise.all)", async () => {
    // AC #1 + Architecture §5 Step 1 — all 4 fetches happen concurrently
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

    vi.mocked(fetchPropertiesForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({ columns: vi.fn().mockResolvedValue([]) }),
    } as never);
    vi.mocked(diffProperties).mockReturnValue({ new: [], updated: [], unchanged: [], removed: [] });
    vi.mocked(softDeleteProperties).mockResolvedValue(0);
    vi.mocked(updateAgentListingCounts).mockResolvedValue(undefined);
    vi.mocked(updateSyncLog).mockResolvedValue(undefined);

    await runSyncPipeline();

    // Both offices called for properties (PZ + DOM)
    expect(fetchPropertiesForOffice).toHaveBeenCalledTimes(2);
    // Both offices called for agents (PZ + DOM)
    expect(fetchAgentsForOffice).toHaveBeenCalledTimes(2);
  });

  it.skip("[P0] updates sync_log to status='success' with accurate counts on completion", async () => {
    // AC #9 — sync_log updated with success + counts after successful run
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

    const newProps = [
      makeRawProperty({ apiId: "NEW-1" }),
      makeRawProperty({ apiId: "NEW-2" }),
    ];
    const updatedProps = [makeRawProperty({ apiId: "UPD-1" })];
    const agent = makeRawAgent();

    vi.mocked(fetchPropertiesForOffice)
      .mockResolvedValueOnce({ records: [...newProps, ...updatedProps], parseErrors: [] })
      .mockResolvedValueOnce({ records: [], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice)
      .mockResolvedValueOnce({ records: [agent], parseErrors: [] })
      .mockResolvedValueOnce({ records: [], parseErrors: [] });
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({ columns: vi.fn().mockResolvedValue([]) }),
    } as never);
    vi.mocked(diffProperties).mockReturnValue({
      new: newProps,
      updated: updatedProps,
      unchanged: [],
      removed: ["GONE-1"],
    });
    vi.mocked(upsertProperty).mockResolvedValue(undefined);
    vi.mocked(softDeleteProperties).mockResolvedValue(1); // 1 removed
    vi.mocked(upsertAgent).mockResolvedValue(undefined);
    vi.mocked(updateAgentListingCounts).mockResolvedValue(undefined);
    vi.mocked(updateSyncLog).mockResolvedValue(undefined);

    await runSyncPipeline();

    expect(updateSyncLog).toHaveBeenCalledWith(
      syncLog.id,
      expect.objectContaining({
        status: "success",
        propertiesCreated: 2,
        propertiesUpdated: 1,
        propertiesRemoved: 1,
        agentsSynced: 1,
      }),
    );
  });

  it.skip("[P0] upserts only NEW and UPDATED records — zero writes for UNCHANGED", async () => {
    // AC #4, NFR15 — incremental processing, no DB write for unchanged records
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

    const unchanged = Array.from({ length: 5 }, (_, i) =>
      makeRawProperty({ apiId: `SAME-${i}` }),
    );
    const newProp = makeRawProperty({ apiId: "NEW-1" });

    vi.mocked(fetchPropertiesForOffice)
      .mockResolvedValueOnce({ records: [...unchanged, newProp], parseErrors: [] })
      .mockResolvedValueOnce({ records: [], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({ columns: vi.fn().mockResolvedValue([]) }),
    } as never);
    vi.mocked(diffProperties).mockReturnValue({
      new: [newProp],
      updated: [],
      unchanged,
      removed: [],
    });
    vi.mocked(upsertProperty).mockResolvedValue(undefined);
    vi.mocked(softDeleteProperties).mockResolvedValue(0);
    vi.mocked(updateAgentListingCounts).mockResolvedValue(undefined);
    vi.mocked(updateSyncLog).mockResolvedValue(undefined);

    await runSyncPipeline();

    // upsertProperty called only for the 1 new property, NOT for the 5 unchanged
    expect(upsertProperty).toHaveBeenCalledTimes(1);
  });

  it.skip("[P0] calls /api/revalidate after successful sync (ISR revalidation)", async () => {
    // AC #14, Risk R-005 — ISR revalidation endpoint must be called
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);
    vi.mocked(fetchPropertiesForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({ columns: vi.fn().mockResolvedValue([]) }),
    } as never);
    vi.mocked(diffProperties).mockReturnValue({ new: [], updated: [], unchanged: [], removed: [] });
    vi.mocked(softDeleteProperties).mockResolvedValue(0);
    vi.mocked(updateAgentListingCounts).mockResolvedValue(undefined);
    vi.mocked(updateSyncLog).mockResolvedValue(undefined);

    await runSyncPipeline();

    // Verify fetch was called with the revalidate URL
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/revalidate"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-api-secret": process.env.API_SECRET,
        }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Error / edge-case paths
// ---------------------------------------------------------------------------

describe("runSyncPipeline — error handling", () => {
  it.skip("[P0] updates sync_log to status='failure' when an uncaught exception is thrown", async () => {
    // AC #10 — on uncaught error, log must record failure before re-throwing
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);
    vi.mocked(updateSyncLog).mockResolvedValue(undefined);

    // Simulate a catastrophic failure in the fetch layer
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

  it.skip("[P0] sets status='partial' when some records fail Zod validation (pipeline continues)", async () => {
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
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({ columns: vi.fn().mockResolvedValue([]) }),
    } as never);
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

  it.skip("[P0] completes successfully when Altitud Cero returns [] for properties", async () => {
    // AC #15, API8 — empty office must not crash the pipeline
    // Risk R-010: empty Altitud Cero must be a no-op
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

    vi.mocked(fetchPropertiesForOffice)
      .mockResolvedValueOnce({ records: [makeRawProperty()], parseErrors: [] }) // PZ
      .mockResolvedValueOnce({ records: [], parseErrors: [] }); // DOM (Altitud Cero = empty)
    vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({ columns: vi.fn().mockResolvedValue([]) }),
    } as never);
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

  it.skip("[P1] records lotSizeUnitWarning entries in sync_log.errors without blocking the upsert", async () => {
    // AC #12 — lot size warnings are recorded as errors but do not block the sync
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

    const warningProp = makeRawProperty({ apiId: "LOT-WARN-1", lotSizeUnitWarning: true });

    vi.mocked(fetchPropertiesForOffice)
      .mockResolvedValueOnce({ records: [warningProp], parseErrors: [] })
      .mockResolvedValueOnce({ records: [], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({ columns: vi.fn().mockResolvedValue([]) }),
    } as never);
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
    expect(upsertProperty).toHaveBeenCalledWith(
      expect.objectContaining({ apiId: "LOT-WARN-1" }),
      expect.any(String),
    );

    // The warning is appended to errors JSONB
    expect(updateSyncLog).toHaveBeenCalledWith(
      syncLog.id,
      expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ apiId: "LOT-WARN-1", scope: expect.stringMatching(/lot_size_warning/i) }),
        ]),
      }),
    );
  });

  it.skip("[P1] does NOT fail the overall sync if /api/revalidate returns a non-2xx response", async () => {
    // AC #14 — revalidation is best-effort; failure must not crash the pipeline
    // AR6: revalidation failure logs a warning, sync data is already persisted
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);
    vi.mocked(fetchPropertiesForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({ columns: vi.fn().mockResolvedValue([]) }),
    } as never);
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

  it.skip("[P1] soft-deletes REMOVED apiIds after diff", async () => {
    // AC #6 — listings absent from API → is_visible=false (no hard delete)
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);
    vi.mocked(fetchPropertiesForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({ columns: vi.fn().mockResolvedValue([]) }),
    } as never);
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

  it.skip("[P1] updates agent listing_count after property upserts complete", async () => {
    // AC #8 — denormalized listing_count updated after property upserts
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

    const agent = makeRawAgent();
    vi.mocked(fetchPropertiesForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice)
      .mockResolvedValueOnce({ records: [agent], parseErrors: [] })
      .mockResolvedValueOnce({ records: [], parseErrors: [] });
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({ columns: vi.fn().mockResolvedValue([]) }),
    } as never);
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

// ---------------------------------------------------------------------------
// /api/sync route — auth guard (AC #13)
// ---------------------------------------------------------------------------

describe("/api/sync route — authorization guard", () => {
  it.skip("[P0] returns 401 when CRON_SECRET header is missing", async () => {
    // AC #13 — no sync work begins without valid auth
    // This test targets the route handler directly
    const { POST } = await import("@/app/api/sync/route");

    const request = new Request("http://localhost:3000/api/sync", {
      method: "POST",
      // No Authorization header
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    // Ensure no sync pipeline was triggered
    expect(createSyncLog).not.toHaveBeenCalled();
  });

  it.skip("[P0] returns 401 when CRON_SECRET header does not match env var", async () => {
    // AC #13 — wrong secret must be rejected
    const { POST } = await import("@/app/api/sync/route");

    const request = new Request("http://localhost:3000/api/sync", {
      method: "POST",
      headers: { Authorization: "Bearer wrong-secret" },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(createSyncLog).not.toHaveBeenCalled();
  });

  it.skip("[P1] returns 200 and runs the pipeline when CRON_SECRET is correct", async () => {
    // AC #13 (positive path) — valid auth triggers the pipeline
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);
    vi.mocked(fetchPropertiesForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({ columns: vi.fn().mockResolvedValue([]) }),
    } as never);
    vi.mocked(diffProperties).mockReturnValue({ new: [], updated: [], unchanged: [], removed: [] });
    vi.mocked(softDeleteProperties).mockResolvedValue(0);
    vi.mocked(updateAgentListingCounts).mockResolvedValue(undefined);
    vi.mocked(updateSyncLog).mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/sync/route");

    const request = new Request("http://localhost:3000/api/sync", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(createSyncLog).toHaveBeenCalledOnce();
  });
});
