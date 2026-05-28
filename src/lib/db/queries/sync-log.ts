import "server-only";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { syncLogs } from "@/lib/db/schema/sync-logs";
import type { NewSyncLog, SyncLog } from "@/lib/db/schema/sync-logs";
import { properties } from "@/lib/db/schema/properties";

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

/**
 * getSyncLogs fetches chronological sync logs successfully.
 * Supports status, date range filters, and pagination.
 */
export async function getSyncLogs(filters: {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<SyncLog[]> {
  let limitVal =
    typeof filters.limit === "number" && !isNaN(filters.limit) ? Math.floor(filters.limit) : 20;
  let offsetVal =
    typeof filters.offset === "number" && !isNaN(filters.offset) ? Math.floor(filters.offset) : 0;
  limitVal = Math.max(1, limitVal);
  offsetVal = Math.max(0, offsetVal);

  const conditions = [];
  if (filters.status && filters.status !== "all") {
    conditions.push(eq(syncLogs.status, filters.status));
  }
  if (filters.startDate) {
    conditions.push(gte(syncLogs.startedAt, filters.startDate));
  }
  if (filters.endDate) {
    conditions.push(lte(syncLogs.startedAt, filters.endDate));
  }

  const query = db.select().from(syncLogs);

  if (conditions.length > 0) {
    query.where(and(...conditions));
  }

  return query.orderBy(desc(syncLogs.startedAt)).limit(limitVal).offset(offsetVal);
}

/**
 * getSyncDashboardStats retrieves active listings count and last successful sync metadata.
 */
export async function getSyncDashboardStats(): Promise<{
  activeListings: number;
  lastSuccessfulSync: Date | null;
}> {
  const activeCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(properties)
    .where(eq(properties.isVisible, true));

  const activeListings = Number(activeCountResult[0]?.count ?? 0);

  const lastSyncResult = await db
    .select()
    .from(syncLogs)
    .where(eq(syncLogs.status, "success"))
    .orderBy(desc(syncLogs.completedAt))
    .limit(1);

  const lastSuccessfulSync = lastSyncResult[0]?.completedAt ?? null;

  return {
    activeListings,
    lastSuccessfulSync,
  };
}

/**
 * formatSyncDuration converts sync duration in milliseconds to human-readable format.
 */
export function formatSyncDuration(ms: number): string {
  if (ms < 1000) return "0s";
  const seconds = Math.floor(ms / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);

  return parts.join(" ");
}
