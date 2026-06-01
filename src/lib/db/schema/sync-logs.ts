import { sql } from "drizzle-orm";
import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** Sync pipeline run log. One row per REMAX CCA sync invocation. */
export const syncLogs = pgTable("sync_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  status: text("status").notNull(),
  propertiesFetched: integer("properties_fetched").notNull().default(0),
  propertiesCreated: integer("properties_created").notNull().default(0),
  propertiesUpdated: integer("properties_updated").notNull().default(0),
  propertiesRemoved: integer("properties_removed").notNull().default(0),
  agentsSynced: integer("agents_synced").notNull().default(0),
  translationsQueued: integer("translations_queued").notNull().default(0),
  tagsQueued: integer("tags_queued").notNull().default(0),
  imagesOptimized: integer("images_optimized").notNull().default(0),
  errors: jsonb("errors")
    .notNull()
    .default(sql`'[]'::jsonb`),
  errorMessage: text("error_message"),
  officeGuid: text("office_guid"),
  details: jsonb("details")
    .notNull()
    .default(sql`'{}'::jsonb`),
});

export type SyncLog = typeof syncLogs.$inferSelect;
export type NewSyncLog = typeof syncLogs.$inferInsert;
