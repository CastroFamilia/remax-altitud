/**
 * ATDD Red-Phase Scaffolds — Story 2.4: Image Optimization Pipeline
 * Module: src/lib/sync/pipeline.ts (image-optimizer integration)
 *
 * TDD RED PHASE — all tests are skipped until the pipeline integration is implemented.
 * Covers AC #8 (skip UNCHANGED), AC #9 (re-process ALL images on UPDATED),
 * AC #11 (imagesOptimized counter in sync_log).
 *
 * All external dependencies are mocked — no live DB or API calls.
 *
 * To activate: change `it.skip` → `it` per task, then verify RED → GREEN.
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

// Mock the image optimizer — controls what the optimizer "returns" without real sharp/fetch
vi.mock("@/lib/sync/image-optimizer", () => ({
  optimizePropertyImages: vi.fn(),
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
  vi.mocked(upsertProperty).mockResolvedValue(undefined);
  vi.mocked(softDeleteProperties).mockResolvedValue(0);
  vi.mocked(upsertAgent).mockResolvedValue(undefined);
  vi.mocked(updateAgentListingCounts).mockResolvedValue(undefined);
  vi.mocked(updateSyncLog).mockResolvedValue(undefined);
  vi.mocked(updatePropertyImages).mockResolvedValue(undefined);

  // Default: optimizer returns 0 optimized images
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
// AC #8 — UNCHANGED properties: optimizer is NOT called
// ---------------------------------------------------------------------------

describe("runSyncPipeline — image optimizer skips UNCHANGED (AC #8, NFR15)", () => {
  it.skip(
    "[P0] given diff returns only UNCHANGED properties when pipeline runs then optimizePropertyImages is never called",
    async () => {
      // THIS TEST WILL FAIL — image optimizer integration not implemented yet
      const syncLog = makeSyncLog();
      vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

      const unchangedProp = makeRawProperty({ apiId: "SAME-1" });
      vi.mocked(fetchPropertiesForOffice).mockResolvedValue({ records: [unchangedProp], parseErrors: [] });
      vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
      vi.mocked(diffProperties).mockReturnValue({
        new: [],
        updated: [],
        unchanged: [unchangedProp],
        removed: [],
      });

      await runSyncPipeline();

      expect(optimizePropertyImages).not.toHaveBeenCalled();
    },
  );
});

// ---------------------------------------------------------------------------
// AC #9 — UPDATED properties: optimizer IS called for all images
// ---------------------------------------------------------------------------

describe("runSyncPipeline — image optimizer runs on NEW and UPDATED (AC #9)", () => {
  it.skip(
    "[P0] given diff returns 1 NEW property when pipeline runs then optimizePropertyImages is called once",
    async () => {
      const syncLog = makeSyncLog();
      vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

      const newProp = makeRawProperty({ apiId: "NEW-1" });
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

      await runSyncPipeline();

      expect(optimizePropertyImages).toHaveBeenCalledOnce();
      expect(optimizePropertyImages).toHaveBeenCalledWith(
        newProp.apiId,
        newProp.images,
        expect.any(String), // propertyType
        expect.any(String), // location
      );
    },
  );

  it.skip(
    "[P0] given diff returns 1 UPDATED property when pipeline runs then optimizePropertyImages is called once",
    async () => {
      const syncLog = makeSyncLog();
      vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

      const updatedProp = makeRawProperty({ apiId: "UPD-1" });
      vi.mocked(fetchPropertiesForOffice)
        .mockResolvedValueOnce({ records: [updatedProp], parseErrors: [] })
        .mockResolvedValueOnce({ records: [], parseErrors: [] });
      vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
      vi.mocked(diffProperties).mockReturnValue({
        new: [],
        updated: [updatedProp],
        unchanged: [],
        removed: [],
      });

      await runSyncPipeline();

      expect(optimizePropertyImages).toHaveBeenCalledOnce();
    },
  );

  it.skip(
    "[P1] given diff returns 2 NEW + 1 UPDATED when pipeline runs then optimizePropertyImages is called 3 times",
    async () => {
      const syncLog = makeSyncLog();
      vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

      const newProps = [makeRawProperty({ apiId: "NEW-1" }), makeRawProperty({ apiId: "NEW-2" })];
      const updatedProp = makeRawProperty({ apiId: "UPD-1" });

      vi.mocked(fetchPropertiesForOffice)
        .mockResolvedValueOnce({ records: [...newProps, updatedProp], parseErrors: [] })
        .mockResolvedValueOnce({ records: [], parseErrors: [] });
      vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
      vi.mocked(diffProperties).mockReturnValue({
        new: newProps,
        updated: [updatedProp],
        unchanged: [],
        removed: [],
      });

      await runSyncPipeline();

      expect(optimizePropertyImages).toHaveBeenCalledTimes(3);
    },
  );

  it.skip(
    "[P1] given optimizer result then updatePropertyImages is called with the apiId and optimized images",
    async () => {
      const syncLog = makeSyncLog();
      vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

      const newProp = makeRawProperty({ apiId: "NEW-1" });
      const fakeOptimized = [
        {
          src: "/property-images/NEW-1/photo1-400w.webp",
          srcset: "/property-images/NEW-1/photo1-400w.webp 400w, /property-images/NEW-1/photo1-800w.webp 800w, /property-images/NEW-1/photo1-1600w.webp 1600w",
          blurDataUrl: "data:image/webp;base64,abc123",
          width: 400 as const,
          height: 267,
          alt: "Photo 1 of 1 — Lot/Land in San Francisco, Perez Zeledon",
        },
      ];

      vi.mocked(optimizePropertyImages).mockResolvedValue({ optimized: fakeOptimized, errors: [] });
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

      await runSyncPipeline();

      expect(updatePropertyImages).toHaveBeenCalledWith("NEW-1", fakeOptimized);
    },
  );
});

// ---------------------------------------------------------------------------
// AC #11 — imagesOptimized counter in sync_log
// ---------------------------------------------------------------------------

describe("runSyncPipeline — imagesOptimized counter in sync_log (AC #11)", () => {
  it.skip(
    "[P0] given optimizer returns 0 optimized images when pipeline completes then updateSyncLog includes imagesOptimized:0",
    async () => {
      const syncLog = makeSyncLog();
      vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);
      vi.mocked(fetchPropertiesForOffice).mockResolvedValue({ records: [], parseErrors: [] });
      vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
      vi.mocked(diffProperties).mockReturnValue({ new: [], updated: [], unchanged: [], removed: [] });
      vi.mocked(optimizePropertyImages).mockResolvedValue({ optimized: [], errors: [] });

      await runSyncPipeline();

      expect(updateSyncLog).toHaveBeenCalledWith(
        syncLog.id,
        expect.objectContaining({ imagesOptimized: 0 }),
      );
    },
  );

  it.skip(
    "[P0] given optimizer returns 3 variants (1 source × 3 sizes) when pipeline completes then updateSyncLog includes imagesOptimized:3",
    async () => {
      const syncLog = makeSyncLog();
      vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

      const newProp = makeRawProperty({ apiId: "NEW-1", images: ["https://cdn.example.com/photo1.jpg"] });
      const fakeOptimized = Array.from({ length: 3 }, (_, i) => ({
        src: `/property-images/NEW-1/photo1-${[400, 800, 1600][i]}w.webp`,
        srcset: "",
        blurDataUrl: "data:image/webp;base64,abc",
        width: 400 as const,
        height: 267,
        alt: "Photo 1 of 1 — Lot/Land in San Francisco",
      }));

      vi.mocked(optimizePropertyImages).mockResolvedValue({ optimized: fakeOptimized, errors: [] });
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

      await runSyncPipeline();

      expect(updateSyncLog).toHaveBeenCalledWith(
        syncLog.id,
        expect.objectContaining({ imagesOptimized: 3 }),
      );
    },
  );

  it.skip(
    "[P1] given 2 NEW properties each with 1 source image (→ 3 variants each) when pipeline completes then updateSyncLog includes imagesOptimized:6",
    async () => {
      const syncLog = makeSyncLog();
      vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);

      const newProps = [
        makeRawProperty({ apiId: "NEW-1", images: ["https://cdn.example.com/p1.jpg"] }),
        makeRawProperty({ apiId: "NEW-2", images: ["https://cdn.example.com/p2.jpg"] }),
      ];

      // Each property optimizer call returns 3 optimized variants
      vi.mocked(optimizePropertyImages).mockResolvedValue({
        optimized: Array.from({ length: 3 }, (_, i) => ({
          src: `/property-images/X/photo-${[400, 800, 1600][i]}w.webp`,
          srcset: "",
          blurDataUrl: "data:image/webp;base64,abc",
          width: 400 as const,
          height: 267,
          alt: "Photo 1 of 1 — X in Y",
        })),
        errors: [],
      });

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

      await runSyncPipeline();

      expect(updateSyncLog).toHaveBeenCalledWith(
        syncLog.id,
        expect.objectContaining({ imagesOptimized: 6 }),
      );
    },
  );
});
