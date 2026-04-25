/**
 * Story 2.3: Sync Pipeline Core — Happy Path Tests
 * Module: src/lib/sync/pipeline.ts
 *
 * Covers AC #1 (log ordering), AC #3/#4 (upsert only new/updated),
 * AC #8 (agent listing counts), AC #9 (success status + counts),
 * AC #14 (ISR revalidation), Architecture §5 Step 1 (parallel fetch).
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
  updatePropertyTranslations: vi.fn(),
  // Story 2.6 — lifestyle tagging DB helpers
  fetchPropertyLifestyleTags: vi.fn().mockResolvedValue(new Map()),
  updatePropertyLifestyleTags: vi.fn().mockResolvedValue(undefined),
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

// Story 2.5 — Mock translator to prevent real DeepL calls in pipeline tests (ATDD red phase)
vi.mock("@/lib/sync/translator", () => ({
  translateBatch: vi.fn().mockResolvedValue({ results: [], errors: [] }),
}));

// Story 2.6 — Mock lifestyle-tagger to prevent real rule evaluation in pipeline tests
vi.mock("@/lib/sync/lifestyle-tagger", () => ({
  tagBatch: vi.fn().mockReturnValue([]),
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
  fetchPropertyLifestyleTags,
  updatePropertyLifestyleTags,
} from "@/lib/db/queries/properties";
import { upsertAgent, updateAgentListingCounts } from "@/lib/db/queries/agents";
import { optimizePropertyImages } from "@/lib/sync/image-optimizer";
import { translateBatch } from "@/lib/sync/translator";
import { tagBatch } from "@/lib/sync/lifestyle-tagger";
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
  // Story 2.5 — reset translateBatch mock to default (no translations, no errors)
  vi.mocked(translateBatch).mockResolvedValue({ results: [], errors: [] });
  // Story 2.6 — reset lifestyle tagging mocks after vi.clearAllMocks()
  vi.mocked(fetchPropertyLifestyleTags).mockResolvedValue(new Map());
  vi.mocked(updatePropertyLifestyleTags).mockResolvedValue(undefined);
  vi.mocked(tagBatch).mockReturnValue([]);

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
  it("[P0] creates sync_log with status='running' BEFORE fetching any data", async () => {
    // AC #1 — sync_log row created as first action, before API calls
    // Risk R-011: log created before any external call
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

    const pzProp = makeRawProperty({ apiId: "P1" });
    const domProp = makeRawProperty({
      apiId: "P2",
      officeId: "4AD5AE8F-5B47-4A1A-A953-40445F2B4940",
    });
    const agent = makeRawAgent();

    vi.mocked(fetchPropertiesForOffice)
      .mockResolvedValueOnce({ records: [pzProp], parseErrors: [] })
      .mockResolvedValueOnce({ records: [domProp], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice)
      .mockResolvedValueOnce({ records: [agent], parseErrors: [] })
      .mockResolvedValueOnce({ records: [], parseErrors: [] });

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

  it("[P0] fetches all 4 endpoints in parallel (Promise.all)", async () => {
    // AC #1 + Architecture §5 Step 1 — all 4 fetches happen concurrently
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

    vi.mocked(fetchPropertiesForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
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

  it("[P0] updates sync_log to status='success' with accurate counts on completion", async () => {
    // AC #9 — sync_log updated with success + counts after successful run
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

    const newProps = [makeRawProperty({ apiId: "NEW-1" }), makeRawProperty({ apiId: "NEW-2" })];
    const updatedProps = [makeRawProperty({ apiId: "UPD-1" })];
    const agent = makeRawAgent();

    vi.mocked(fetchPropertiesForOffice)
      .mockResolvedValueOnce({ records: [...newProps, ...updatedProps], parseErrors: [] })
      .mockResolvedValueOnce({ records: [], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice)
      .mockResolvedValueOnce({ records: [agent], parseErrors: [] })
      .mockResolvedValueOnce({ records: [], parseErrors: [] });
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

  it("[P0] upserts only NEW and UPDATED records — zero writes for UNCHANGED", async () => {
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

  it("[P0] calls /api/revalidate after successful sync (ISR revalidation)", async () => {
    // AC #14, Risk R-005 — ISR revalidation endpoint must be called
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);
    vi.mocked(fetchPropertiesForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(diffProperties).mockReturnValue({ new: [], updated: [], unchanged: [], removed: [] });
    vi.mocked(softDeleteProperties).mockResolvedValue(0);
    vi.mocked(updateAgentListingCounts).mockResolvedValue(undefined);
    vi.mocked(updateSyncLog).mockResolvedValue(undefined);

    await runSyncPipeline();

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

  it("[P0] resolves office UUID from the GUID the record was fetched under, NOT from RawProperty.officeApiId (regression)", async () => {
    // Regression: parser's `officeApiId` is a numeric RE/MAX OfficeID (e.g. 218),
    // not a GUID. The pipeline must use the GUID it fetched the record under
    // to resolve the office UUID — otherwise every record would silently fall
    // back to an arbitrary office.
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

    // PZ-fetched record reports a numeric officeApiId — must NOT be used as a key
    const pzProp = makeRawProperty({ apiId: "P-PZ", officeApiId: 218 });
    const domProp = makeRawProperty({ apiId: "P-DOM", officeApiId: 235 });

    vi.mocked(fetchPropertiesForOffice)
      .mockResolvedValueOnce({ records: [pzProp], parseErrors: [] })
      .mockResolvedValueOnce({ records: [domProp], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(diffProperties).mockReturnValue({
      new: [pzProp, domProp],
      updated: [],
      unchanged: [],
      removed: [],
    });
    vi.mocked(upsertProperty).mockResolvedValue(undefined);
    vi.mocked(softDeleteProperties).mockResolvedValue(0);
    vi.mocked(updateAgentListingCounts).mockResolvedValue(undefined);
    vi.mocked(updateSyncLog).mockResolvedValue(undefined);

    await runSyncPipeline();

    // Each record was fetched under a different GUID; the upsert should be
    // called with the office UUID matching the fetch source — exact mapping
    // confirmed by the officeMap mock (PZ → office-uuid-pz, DOM → office-uuid-dom).
    const calls = vi.mocked(upsertProperty).mock.calls;
    expect(calls).toHaveLength(2);
    const pzCall = calls.find((c) => c[0].apiId === "P-PZ");
    const domCall = calls.find((c) => c[0].apiId === "P-DOM");
    expect(pzCall?.[1]).toBe("office-uuid-pz");
    expect(domCall?.[1]).toBe("office-uuid-dom");
  });

  it("[P0] throws and marks sync as failure when an office GUID cannot be resolved", async () => {
    // Regression: silent fallback to an arbitrary office is dangerous —
    // unknown GUIDs must surface as an explicit error.
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);
    vi.mocked(updateSyncLog).mockResolvedValue(undefined);

    // Office map is EMPTY — nothing can be resolved
    vi.mocked(fetchOfficeIdMap).mockResolvedValue(new Map());

    const agent = makeRawAgent();
    vi.mocked(fetchPropertiesForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice)
      .mockResolvedValueOnce({ records: [agent], parseErrors: [] })
      .mockResolvedValueOnce({ records: [], parseErrors: [] });
    vi.mocked(diffProperties).mockReturnValue({ new: [], updated: [], unchanged: [], removed: [] });

    await expect(runSyncPipeline()).rejects.toThrow(/Unknown office GUID/);

    expect(updateSyncLog).toHaveBeenCalledWith(
      syncLog.id,
      expect.objectContaining({ status: "failure" }),
    );
  });
});

// ---------------------------------------------------------------------------
// Story 2.5 ATDD — Translation pipeline integration (red-phase scaffolds)
// ---------------------------------------------------------------------------

describe("runSyncPipeline — translation step (Story 2.5, ATDD red phase)", () => {
  it(
    "[P0] given 0 new/updated properties when pipeline runs then translationsQueued is 0 in the sync log",
    async () => {
      // AC #9 — sync log must record translations_queued count
      // AC #4 — UNCHANGED properties → zero DeepL calls
      const syncLog = makeSyncLog();
      vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

      vi.mocked(fetchPropertiesForOffice).mockResolvedValue({ records: [], parseErrors: [] });
      vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
      vi.mocked(diffProperties).mockReturnValue({ new: [], updated: [], unchanged: [], removed: [] });
      vi.mocked(softDeleteProperties).mockResolvedValue(0);
      vi.mocked(updateAgentListingCounts).mockResolvedValue(undefined);
      vi.mocked(updateSyncLog).mockResolvedValue(undefined);

      await runSyncPipeline();

      expect(updateSyncLog).toHaveBeenCalledWith(
        syncLog.id,
        expect.objectContaining({ translationsQueued: 0 }),
      );
      // translateBatch must NOT be called when there are no new/updated properties
      expect(translateBatch).not.toHaveBeenCalled();
    },
  );

  it(
    "[P0] given 2 new properties when pipeline runs then translateBatch is called with 2 items and translationsQueued is 2",
    async () => {
      // AC #9 — translationsQueued = count of new+updated listings sent to translation
      const syncLog = makeSyncLog();
      vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

      const newProps = [
        makeRawProperty({ apiId: "NEW-1", titleEs: "", publicRemarksEs: "" }),
        makeRawProperty({ apiId: "NEW-2", titleEs: "", publicRemarksEs: "" }),
      ];

      vi.mocked(fetchPropertiesForOffice)
        .mockResolvedValueOnce({ records: newProps, parseErrors: [] })
        .mockResolvedValueOnce({ records: [], parseErrors: [] });
      vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
      vi.mocked(diffProperties).mockReturnValue({
        new: newProps,
        updated: [],
        unchanged: [],
        removed: [],
      });
      vi.mocked(upsertProperty).mockResolvedValue(undefined);
      vi.mocked(softDeleteProperties).mockResolvedValue(0);
      vi.mocked(updateAgentListingCounts).mockResolvedValue(undefined);
      vi.mocked(updateSyncLog).mockResolvedValue(undefined);

      await runSyncPipeline();

      expect(translateBatch).toHaveBeenCalledOnce();
      expect(vi.mocked(translateBatch).mock.calls[0][0]).toHaveLength(2);
      expect(updateSyncLog).toHaveBeenCalledWith(
        syncLog.id,
        expect.objectContaining({ translationsQueued: 2 }),
      );
    },
  );

  it(
    "[P0] given 1 new and 1 updated property when pipeline runs then translateBatch is called with 2 items",
    async () => {
      // AC #4, AC #9 — both new and updated listings enter the translation queue
      const syncLog = makeSyncLog();
      vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

      const newProp = makeRawProperty({ apiId: "NEW-1" });
      const updatedProp = makeRawProperty({ apiId: "UPD-1" });

      vi.mocked(fetchPropertiesForOffice)
        .mockResolvedValueOnce({ records: [newProp, updatedProp], parseErrors: [] })
        .mockResolvedValueOnce({ records: [], parseErrors: [] });
      vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
      vi.mocked(diffProperties).mockReturnValue({
        new: [newProp],
        updated: [updatedProp],
        unchanged: [],
        removed: [],
      });
      vi.mocked(upsertProperty).mockResolvedValue(undefined);
      vi.mocked(softDeleteProperties).mockResolvedValue(0);
      vi.mocked(updateAgentListingCounts).mockResolvedValue(undefined);
      vi.mocked(updateSyncLog).mockResolvedValue(undefined);

      await runSyncPipeline();

      const batchInput = vi.mocked(translateBatch).mock.calls[0][0];
      expect(batchInput).toHaveLength(2);
      const apiIds = batchInput.map((item: { apiId: string }) => item.apiId);
      expect(apiIds).toContain("NEW-1");
      expect(apiIds).toContain("UPD-1");
    },
  );

  it(
    "[P0] given UNCHANGED properties only when pipeline runs then translateBatch is NOT called (NFR15 — zero DeepL calls)",
    async () => {
      // AC #4, NFR15 — incremental processing: unchanged listings skip translation entirely
      const syncLog = makeSyncLog();
      vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

      const unchanged = [
        makeRawProperty({ apiId: "SAME-1" }),
        makeRawProperty({ apiId: "SAME-2" }),
      ];

      vi.mocked(fetchPropertiesForOffice)
        .mockResolvedValueOnce({ records: unchanged, parseErrors: [] })
        .mockResolvedValueOnce({ records: [], parseErrors: [] });
      vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
      vi.mocked(diffProperties).mockReturnValue({
        new: [],
        updated: [],
        unchanged,
        removed: [],
      });
      vi.mocked(softDeleteProperties).mockResolvedValue(0);
      vi.mocked(updateAgentListingCounts).mockResolvedValue(undefined);
      vi.mocked(updateSyncLog).mockResolvedValue(undefined);

      await runSyncPipeline();

      // Zero DeepL calls for UNCHANGED — enforced by NFR15
      expect(translateBatch).not.toHaveBeenCalled();
    },
  );

  it(
    "[P1] given translateBatch returns a translation error when pipeline runs then sync log contains the translation_error in errors array",
    async () => {
      // AC #6 — translation error → pipeline continues, error recorded in sync log
      const syncLog = makeSyncLog();
      vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

      const newProp = makeRawProperty({ apiId: "ERR-PROP-1" });

      vi.mocked(fetchPropertiesForOffice)
        .mockResolvedValueOnce({ records: [newProp], parseErrors: [] })
        .mockResolvedValueOnce({ records: [], parseErrors: [] });
      vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
      vi.mocked(diffProperties).mockReturnValue({
        new: [newProp],
        updated: [],
        unchanged: [],
        removed: [],
      });
      vi.mocked(upsertProperty).mockResolvedValue(undefined);
      vi.mocked(softDeleteProperties).mockResolvedValue(0);
      vi.mocked(updateAgentListingCounts).mockResolvedValue(undefined);
      vi.mocked(updateSyncLog).mockResolvedValue(undefined);

      // Simulate translateBatch returning an error for ERR-PROP-1
      vi.mocked(translateBatch).mockResolvedValue({
        results: [],
        errors: [{ apiId: "ERR-PROP-1", message: "DeepL timeout" }],
      });

      await runSyncPipeline();

      // Pipeline must complete (no throw) and include translation_error in errors
      expect(updateSyncLog).toHaveBeenCalledWith(
        syncLog.id,
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              apiId: "ERR-PROP-1",
              scope: "translation_error",
            }),
          ]),
        }),
      );
    },
  );
});
