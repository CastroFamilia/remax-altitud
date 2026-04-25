/**
 * Story 2.3: Sync Pipeline Core — /api/sync Route Authorization Guard
 * Route: src/app/api/sync/route.ts
 *
 * Covers AC #13 — CRON_SECRET auth guard on the POST /api/sync endpoint.
 * No sync work must begin without a valid Authorization: Bearer header.
 *
 * All pipeline dependencies are mocked — no live DB or API calls.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock all pipeline dependencies
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

// Story 2.4/2.5 — Mock image optimizer and translator to prevent real calls
vi.mock("@/lib/sync/image-optimizer", () => ({
  optimizePropertyImages: vi.fn().mockResolvedValue({ optimized: [], errors: [] }),
}));

vi.mock("@/lib/sync/translator", () => ({
  translateBatch: vi.fn().mockResolvedValue({ results: [], errors: [] }),
}));

// Story 2.6 — Mock lifestyle-tagger to prevent real rule evaluation in sync-route tests
vi.mock("@/lib/sync/lifestyle-tagger", () => ({
  tagBatch: vi.fn().mockReturnValue([]),
}));

// ---------------------------------------------------------------------------
// Imports — resolved after mocks are hoisted
// ---------------------------------------------------------------------------

import { fetchPropertiesForOffice, fetchAgentsForOffice } from "@/lib/sync/api-client";
import { diffProperties } from "@/lib/sync/differ";
import { createSyncLog, updateSyncLog } from "@/lib/db/queries/sync-log";
import {
  softDeleteProperties,
  fetchPropertySnapshot,
  fetchOfficeIdMap,
  fetchAgentIdMap,
} from "@/lib/db/queries/properties";
import { updateAgentListingCounts } from "@/lib/db/queries/agents";
import { makeSyncLog } from "./factories";

// Route handler imported once for the whole suite — avoids repeated dynamic imports
import { POST } from "@/app/api/sync/route";

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
// Authorization guard tests
// ---------------------------------------------------------------------------

describe("/api/sync route — authorization guard", () => {
  it("[P0] returns 401 when CRON_SECRET header is missing", async () => {
    // AC #13 — no sync work begins without valid auth
    const request = new Request("http://localhost:3000/api/sync", {
      method: "POST",
      // No Authorization header
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    // Ensure no sync pipeline was triggered
    expect(createSyncLog).not.toHaveBeenCalled();
  });

  it("[P0] returns 401 when CRON_SECRET header does not match env var", async () => {
    // AC #13 — wrong secret must be rejected
    const request = new Request("http://localhost:3000/api/sync", {
      method: "POST",
      headers: { Authorization: "Bearer wrong-secret" },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(createSyncLog).not.toHaveBeenCalled();
  });

  it("[P1] returns 200 and runs the pipeline when CRON_SECRET is correct", async () => {
    // AC #13 (positive path) — valid auth triggers the pipeline
    const syncLog = makeSyncLog();
    vi.mocked(createSyncLog).mockResolvedValue(syncLog as never);
    vi.mocked(fetchPropertiesForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(fetchAgentsForOffice).mockResolvedValue({ records: [], parseErrors: [] });
    vi.mocked(diffProperties).mockReturnValue({ new: [], updated: [], unchanged: [], removed: [] });
    vi.mocked(softDeleteProperties).mockResolvedValue(0);
    vi.mocked(updateAgentListingCounts).mockResolvedValue(undefined);
    vi.mocked(updateSyncLog).mockResolvedValue(undefined);

    const request = new Request("http://localhost:3000/api/sync", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(createSyncLog).toHaveBeenCalledOnce();
  });
});
