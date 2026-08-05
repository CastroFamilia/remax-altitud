import "server-only";
import { fetchPropertiesForOffice, fetchAgentsForOffice } from "./api-client";
import { sendSyncFailureAlert } from "./alert";
import { computePropertyHash, diffProperties } from "./differ";
import { optimizePropertyImages } from "./image-optimizer";
import { translateBatch } from "./translator";
import { tagBatch } from "./lifestyle-tagger";
import { autoTagCommunities } from "./geo-tagger";
import { createSyncLog, updateSyncLog } from "@/lib/db/queries/sync-log";
import {
  upsertProperty,
  softDeleteProperties,
  fetchPropertySnapshot,
  fetchOfficeIdMap,
  fetchAgentIdMap,
  updatePropertyImages,
  updatePropertyTranslations,
  fetchPropertyLifestyleTags,
  updatePropertyLifestyleTags,
} from "@/lib/db/queries/properties";
import { upsertAgent, softDeleteAgents, updateAgentListingCounts } from "@/lib/db/queries/agents";
import { updateCommunityListingCounts } from "@/lib/db/queries/communities";
import type { ParseError } from "@/types/remax-api";

/** Summary returned by `runSyncPipeline` on success. */
export interface SyncPipelineResult {
  propertiesFetched: number;
  propertiesCreated: number;
  propertiesUpdated: number;
  propertiesRemoved: number;
  agentsSynced: number;
  agentsRemoved: number;
  imagesOptimized: number;
  translationsQueued: number;
  tagsQueued: number;
  errorCount: number;
  status: "success" | "partial";
}

/** Progress event emitted during the sync pipeline. */
export type SyncProgressEvent =
  | { type: "info"; message: string }
  | { type: "agent_upsert"; apiId: string; name: string }
  | { type: "property_upsert"; apiId: string; title: string; action: "create" | "update" }
  | { type: "property_optimize"; apiId: string; imageCount: number }
  | { type: "property_translate"; apiId: string }
  | { type: "property_tag"; apiId: string };

/**
 * Orchestrates the full sync pipeline against the REMAX CCA API.
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
export async function runSyncPipeline(options?: {
  onProgress?: (event: SyncProgressEvent) => void;
}): Promise<SyncPipelineResult> {
  const { onProgress } = options ?? {};
  const progress = (event: SyncProgressEvent) => onProgress?.(event);
  const info = (msg: string) => progress({ type: "info", message: msg });

  // Step 1: Create sync log BEFORE any external call (AC #1)
  const syncLog = await createSyncLog();
  const logId = syncLog.id;

  try {
    const pzGuid = process.env.PZ_OFFICE_GUID ?? "";
    const domGuid = process.env.DOM_OFFICE_GUID ?? "";

    info("Fetching data from REMAX CCA API...");
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

    // Track originating office GUID alongside each record. The parser's
    // `officeApiId` is a numeric REMAX OfficeID (e.g. 218, 235) — NOT a GUID —
    // so we cannot use it as a key into `officeMap` (whose keys are GUIDs).
    // The fetch source is the canonical office identity.
    const allProps = [
      ...pzPropsResult.records.map((r) => ({ raw: r, sourceGuid: pzGuid })),
      ...domPropsResult.records.map((r) => ({ raw: r, sourceGuid: domGuid })),
    ];
    const allAgents = [
      ...pzAgentsResult.records.map((r) => ({ raw: r, sourceGuid: pzGuid })),
      ...domAgentsResult.records.map((r) => ({ raw: r, sourceGuid: domGuid })),
    ];

    info(`Fetched ${allProps.length} properties and ${allAgents.length} agents.`);

    // Step 3: Load DB snapshot for diff (minimal columns — NFR15 guardrail)
    const dbSnapshot = await fetchPropertySnapshot();

    // Build apiId → originating office GUID map for FK resolution on upsert.
    const propGuidByApiId = new Map<string, string>(
      allProps.map((p) => [p.raw.apiId, p.sourceGuid]),
    );

    // Step 4: Diff API vs DB (operates on raw records)
    const rawProps = allProps.map((p) => p.raw);
    const diff = diffProperties(rawProps, dbSnapshot);

    info(
      `Diff complete: ${diff.new.length} new, ${diff.updated.length} updated, ${diff.unchanged.length} unchanged, ${diff.removed.length} removed.`,
    );

    // Step 5: Resolve office UUIDs and upsert agents first (needed for agent FK on properties)
    const officeMap = await fetchOfficeIdMap();

    // Helper: resolve office UUID from GUID; throws on unknown GUID rather than
    // silently misattributing records to an arbitrary office.
    const resolveOfficeId = (guid: string): string => {
      const id = officeMap.get(guid);
      if (!id) {
        throw new Error(
          `Unknown office GUID "${guid}" — not present in offices table. Cannot upsert.`,
        );
      }
      return id;
    };

    // Upsert agents — use the GUID from which the agent was fetched, not the
    // numeric `officeApiId` field (which is not a GUID).
    for (const { raw: rawAgent, sourceGuid } of allAgents) {
      const officeId = resolveOfficeId(sourceGuid);
      progress({ type: "agent_upsert", apiId: rawAgent.apiId, name: rawAgent.name });
      await upsertAgent(rawAgent, officeId);
    }

    // Step 5b: Soft-delete agents no longer returned by the API
    const activeAgentApiIds = allAgents.map(({ raw }) => raw.apiId);
    const agentsRemoved = await softDeleteAgents(activeAgentApiIds);
    if (agentsRemoved > 0) {
      info(`Deactivated ${agentsRemoved} agents no longer in the API.`);
    }

    // Step 6a: Build agent id map for FK resolution on property upsert
    const agentIdMap = await fetchAgentIdMap();

    // Step 6b: Upsert new and updated properties only (UNCHANGED = zero DB writes, NFR15)
    let propertiesCreated = 0;
    let propertiesUpdated = 0;

    for (const raw of diff.new) {
      // Originating GUID was tracked at fetch time. Default to PZ for safety
      // (NEW records always come from one of the two fetched batches).
      const sourceGuid = propGuidByApiId.get(raw.apiId) ?? pzGuid;
      const officeId = resolveOfficeId(sourceGuid);
      const agentId = raw.agentApiId ? (agentIdMap.get(String(raw.agentApiId)) ?? null) : null;
      const apiHash = computePropertyHash(raw);
      progress({ type: "property_upsert", apiId: raw.apiId, title: raw.titleEn, action: "create" });
      await upsertProperty(raw, officeId, agentId, apiHash);
      propertiesCreated++;
    }

    for (const raw of diff.updated) {
      const sourceGuid = propGuidByApiId.get(raw.apiId) ?? pzGuid;
      const officeId = resolveOfficeId(sourceGuid);
      const agentId = raw.agentApiId ? (agentIdMap.get(String(raw.agentApiId)) ?? null) : null;
      const apiHash = computePropertyHash(raw);
      progress({ type: "property_upsert", apiId: raw.apiId, title: raw.titleEn, action: "update" });
      await upsertProperty(raw, officeId, agentId, apiHash);
      propertiesUpdated++;
    }

    // Step 6c: Soft-delete removed apiIds (AC #6)
    if (diff.removed.length > 0) {
      info(`Soft-deleting ${diff.removed.length} removed properties...`);
    }
    const propertiesRemoved =
      diff.removed.length > 0 ? await softDeleteProperties(diff.removed) : 0;

    // Step 7: Update agent listing counts after property upserts (AC #8)
    await updateAgentListingCounts();

    // Step 7a: Translation — translate ONLY new/updated listings (Architecture §5 Step 4, AC #4, NFR15)
    let translationsQueued = 0;
    const translationErrors: ParseError[] = [];

    if (diff.new.length + diff.updated.length > 0) {
      const batchInput = [...diff.new, ...diff.updated].map((raw) => ({
        apiId: raw.apiId,
        titleEn: raw.titleEn,
        titleEs: raw.titleEs,
        publicRemarksEn: raw.publicRemarksEn,
        publicRemarksEs: raw.publicRemarksEs,
      }));
      translationsQueued = batchInput.length;

      info(`Translating ${translationsQueued} properties...`);
      const { results, errors } = await translateBatch(batchInput);

      for (const result of results) {
        if (result.translated && result.titleEs) {
          progress({ type: "property_translate", apiId: result.apiId });
          await updatePropertyTranslations(
            result.apiId,
            result.titleEs,
            result.descriptionEs ?? "",
          );
        }
      }
      for (const err of errors) {
        translationErrors.push({
          apiId: err.apiId,
          scope: "translation_error",
          message: err.message,
          raw: {},
        });
      }
    }

    // Step 7b: Image optimization — run ONLY on new/updated properties (AC #8, #9, NFR15)
    let totalImagesOptimized = 0;
    const imageErrors: ParseError[] = [];

    for (const raw of [...diff.new, ...diff.updated]) {
      const location = raw.location ?? raw.stateProv ?? "Costa Rica";
      const result = await optimizePropertyImages(
        raw.apiId,
        raw.images,
        raw.propertyTypeEn,
        location,
      );
      progress({ type: "property_optimize", apiId: raw.apiId, imageCount: raw.images.length });
      await updatePropertyImages(raw.apiId, result.optimized);
      // AC #11: count individual variant files written to disk.
      // result.optimized.length = number of source images successfully encoded.
      // Each source image produces 3 variant files (400w, 800w, 1600w per Architecture §5).
      totalImagesOptimized += result.optimized.length * 3;
      for (const err of result.errors) {
        imageErrors.push({
          apiId: err.apiId,
          scope: "image_error",
          message: err.error,
          raw: { url: err.url },
        });
      }
    }

    // Step 7c: Lifestyle tagging — ONLY new/updated listings (Architecture §5 Step 6, AC #8, NFR15)
    let tagsQueued = 0;

    const taggable = [...diff.new, ...diff.updated];
    if (taggable.length > 0) {
      const existingTagsMap = await fetchPropertyLifestyleTags(taggable.map((r) => r.apiId));

      const batchInput = taggable.map((raw) => ({
        raw,
        existingTags: existingTagsMap.get(raw.apiId) ?? [],
      }));
      tagsQueued = batchInput.length;

      const taggingResults = tagBatch(batchInput);

      for (const result of taggingResults) {
        if (result.tagged) {
          progress({ type: "property_tag", apiId: result.apiId });
          await updatePropertyLifestyleTags(result.apiId, result.tags);
        }
      }
    }

    // Step 7d: Community geo-tagging (Story 6.5, AC #1, FR50)
    info("Running community geo-fence auto-tagging...");
    const autoTaggedCount = await autoTagCommunities();
    await updateCommunityListingCounts();
    info(`Community geo-fence auto-tagging complete: ${autoTaggedCount} properties tagged.`);

    // Step 8: Collect lotSizeUnitWarning errors (AC #12) — do NOT block upsert
    const warningErrors: ParseError[] = [...diff.new, ...diff.updated]
      .filter((r) => r.lotSizeUnitWarning)
      .map((r) => ({
        apiId: r.apiId,
        scope: "lot_size_warning" as const,
        message: `lotSizeUnitWarning: lot size unit is non-standard for property ${r.apiId}`,
        raw: {},
      }));

    const allErrors: ParseError[] = [
      ...allParseErrors,
      ...warningErrors,
      ...translationErrors,
      ...imageErrors,
    ];

    // Determine final status (AC #9, #11)
    const finalStatus: "success" | "partial" = allErrors.length > 0 ? "partial" : "success";
    const propertiesFetched = rawProps.length;
    const agentsSynced = allAgents.length;
    // agentsRemoved already computed in Step 5b above

    // Step 9: Update sync_log with final status and counts (AC #9)
    await updateSyncLog(logId, {
      status: finalStatus,
      completedAt: new Date(),
      propertiesFetched,
      propertiesCreated,
      propertiesUpdated,
      propertiesRemoved,
      agentsSynced,
      // agentsRemoved is tracked in details JSONB since sync_logs has no dedicated column
      details: { agentsRemoved },
      imagesOptimized: totalImagesOptimized,
      translationsQueued,
      tagsQueued,
      errors: allErrors,
    });

    // Step 10: ISR revalidation — best-effort, non-blocking (AC #14, AR6)
    // Run as un-awaited floating promise to prevent single-threaded local server deadlocks.
    (async () => {
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
    })();

    return {
      propertiesFetched,
      propertiesCreated,
      propertiesUpdated,
      propertiesRemoved,
      agentsSynced,
      agentsRemoved,
      imagesOptimized: totalImagesOptimized,
      translationsQueued,
      tagsQueued,
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
    await sendSyncFailureAlert(message); // AC #1: best-effort alert; swallows its own errors
    throw err;
  }
}
