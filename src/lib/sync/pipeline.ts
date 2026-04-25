import "server-only";
import { fetchPropertiesForOffice, fetchAgentsForOffice } from "./api-client";
import { computePropertyHash, diffProperties } from "./differ";
import { createSyncLog, updateSyncLog } from "@/lib/db/queries/sync-log";
import {
  upsertProperty,
  softDeleteProperties,
  fetchPropertySnapshot,
  fetchOfficeIdMap,
  fetchAgentIdMap,
} from "@/lib/db/queries/properties";
import { upsertAgent, updateAgentListingCounts } from "@/lib/db/queries/agents";
import type { ParseError } from "@/types/remax-api";

/** Summary returned by `runSyncPipeline` on success. */
export interface SyncPipelineResult {
  propertiesFetched: number;
  propertiesCreated: number;
  propertiesUpdated: number;
  propertiesRemoved: number;
  agentsSynced: number;
  errorCount: number;
  status: "success" | "partial";
}

/**
 * Orchestrates the full sync pipeline against the RE/MAX CCA API.
 *
 * Steps:
 * 1. Create sync_log with status="running" (AC #1)
 * 2. Fetch all 4 endpoints in parallel (AC Architecture §5 Step 1)
 * 3. Load DB snapshot for diff
 * 4. Diff API vs DB (AC #2)
 * 5. Upsert agents first (needed to resolve agent FK for properties)
 * 6. Upsert new/updated properties; soft-delete removed (AC #3–#7)
 * 7. Update agent listing counts (AC #8)
 * 8. Append lotSizeUnitWarning errors to JSONB (AC #12)
 * 9. Update sync_log with final status and counts (AC #9)
 * 10. Call /api/revalidate for ISR (AC #14 — best-effort)
 *
 * On uncaught exception: updates sync_log to status="failure" then re-throws (AC #10).
 */
export async function runSyncPipeline(): Promise<SyncPipelineResult> {
  // Step 1: Create sync log BEFORE any external call (AC #1)
  const syncLog = await createSyncLog();
  const logId = syncLog.id;

  try {
    const pzGuid = process.env.PZ_OFFICE_GUID ?? "";
    const domGuid = process.env.DOM_OFFICE_GUID ?? "";

    // Step 2: Fetch all 4 endpoints concurrently (AC Architecture §5 Step 1)
    const [pzPropsResult, domPropsResult, pzAgentsResult, domAgentsResult] = await Promise.all([
      fetchPropertiesForOffice(pzGuid),
      fetchPropertiesForOffice(domGuid),
      fetchAgentsForOffice(pzGuid),
      fetchAgentsForOffice(domGuid),
    ]);

    // Collect all parse errors from all four fetch results
    const allParseErrors: ParseError[] = [
      ...pzPropsResult.parseErrors,
      ...domPropsResult.parseErrors,
      ...pzAgentsResult.parseErrors,
      ...domAgentsResult.parseErrors,
    ];

    const allProps = [...pzPropsResult.records, ...domPropsResult.records];
    const allAgents = [...pzAgentsResult.records, ...domAgentsResult.records];

    // Step 3: Load DB snapshot for diff (minimal columns — NFR15 guardrail)
    const dbSnapshot = await fetchPropertySnapshot();

    // Step 4: Diff API vs DB
    const diff = diffProperties(allProps, dbSnapshot);

    // Step 5: Resolve office UUIDs and upsert agents first (needed for agent FK on properties)
    const officeMap = await fetchOfficeIdMap();

    // Upsert agents
    for (const rawAgent of allAgents) {
      const officeGuid = String(rawAgent.officeApiId);
      const officeId = officeMap.get(officeGuid) ?? [...officeMap.values()][0] ?? "";
      await upsertAgent(rawAgent, officeId);
    }

    // Step 6a: Build agent id map for FK resolution on property upsert
    const agentIdMap = await fetchAgentIdMap();

    // Step 6b: Upsert new and updated properties only (UNCHANGED = zero DB writes, NFR15)
    let propertiesCreated = 0;
    let propertiesUpdated = 0;

    for (const raw of diff.new) {
      const officeGuid = String(raw.officeApiId ?? raw.officeId ?? "");
      const officeId = officeMap.get(officeGuid) ?? [...officeMap.values()][0] ?? "";
      const agentId = raw.agentApiId ? (agentIdMap.get(String(raw.agentApiId)) ?? null) : null;
      const apiHash = computePropertyHash(raw);
      await upsertProperty(raw, officeId, agentId, apiHash);
      propertiesCreated++;
    }

    for (const raw of diff.updated) {
      const officeGuid = String(raw.officeApiId ?? raw.officeId ?? "");
      const officeId = officeMap.get(officeGuid) ?? [...officeMap.values()][0] ?? "";
      const agentId = raw.agentApiId ? (agentIdMap.get(String(raw.agentApiId)) ?? null) : null;
      const apiHash = computePropertyHash(raw);
      await upsertProperty(raw, officeId, agentId, apiHash);
      propertiesUpdated++;
    }

    // Step 6c: Soft-delete removed apiIds (AC #6)
    const propertiesRemoved =
      diff.removed.length > 0 ? await softDeleteProperties(diff.removed) : 0;

    // Step 7: Update agent listing counts after property upserts (AC #8)
    await updateAgentListingCounts();

    // Step 8: Collect lotSizeUnitWarning errors (AC #12) — do NOT block upsert
    const warningErrors: ParseError[] = [...diff.new, ...diff.updated]
      .filter((r) => r.lotSizeUnitWarning)
      .map((r) => ({
        apiId: r.apiId,
        scope: "lot_size_warning" as unknown as "property",
        message: `lotSizeUnitWarning: lot size unit is non-standard for property ${r.apiId}`,
        raw: {},
      }));

    const allErrors: ParseError[] = [...allParseErrors, ...warningErrors];

    // Determine final status (AC #9, #11)
    const finalStatus: "success" | "partial" = allErrors.length > 0 ? "partial" : "success";
    const propertiesFetched = allProps.length;
    const agentsSynced = allAgents.length;

    // Step 9: Update sync_log with final status and counts (AC #9)
    await updateSyncLog(logId, {
      status: finalStatus,
      completedAt: new Date(),
      propertiesFetched,
      propertiesCreated,
      propertiesUpdated,
      propertiesRemoved,
      agentsSynced,
      errors: allErrors,
    });

    // Step 10: ISR revalidation — best-effort, non-blocking (AC #14, AR6)
    try {
      const revalidateUrl = new URL(
        "/api/revalidate",
        process.env.NEXTAUTH_URL ?? "http://localhost:3000",
      ).href;

      const res = await fetch(revalidateUrl, {
        method: "POST",
        headers: {
          "x-api-secret": process.env.API_SECRET ?? "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags: ["properties", "agents"] }),
        cache: "no-store",
      });

      if (!res.ok) {
        console.warn(`[sync] /api/revalidate returned non-2xx: ${res.status}`);
      }
    } catch (revalErr) {
      console.warn("[sync] /api/revalidate call failed (best-effort):", revalErr);
    }

    return {
      propertiesFetched,
      propertiesCreated,
      propertiesUpdated,
      propertiesRemoved,
      agentsSynced,
      errorCount: allErrors.length,
      status: finalStatus,
    };
  } catch (err: unknown) {
    // AC #10 — on uncaught error, mark sync as failed before re-throwing
    const message = err instanceof Error ? err.message : String(err);
    await updateSyncLog(logId, {
      status: "failure",
      errorMessage: message,
      completedAt: new Date(),
    });
    throw err;
  }
}
