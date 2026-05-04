import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { syncLogs } from "@/lib/db/schema/sync-logs";
import type { NewSyncLog, SyncLog } from "@/lib/db/schema/sync-logs";

export type { SyncLog, NewSyncLog };

/**
 * Creates a new sync_log row at pipeline start with status="running".
 * Returns the created row (including generated `id`) for subsequent updates.
 * AC #1 — must be called BEFORE any API fetch.
 */
export async function createSyncLog(): Promise<SyncLog> {
  const rows = await db
    .insert(syncLogs)
    .values({
      status: "running",
      startedAt: new Date(),
      propertiesFetched: 0,
      propertiesCreated: 0,
      propertiesUpdated: 0,
      propertiesRemoved: 0,
      agentsSynced: 0,
      errors: [],
    })
    .returning();

  return rows[0];
}

/**
 * Updates an existing sync_log row by id with the provided partial patch.
 * Accepts any subset of NewSyncLog fields — only passed fields are written.
 * AC #9, #10, #11 — updates status, counts, errors, errorMessage, completedAt.
 */
export async function updateSyncLog(id: string, patch: Partial<NewSyncLog>): Promise<void> {
  await db.update(syncLogs).set(patch).where(eq(syncLogs.id, id));
}
