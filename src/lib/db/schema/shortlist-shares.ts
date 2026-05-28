import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const shortlistShares = pgTable("shortlist_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  shareId: text("share_id").notNull().unique(), // short slug, e.g., 'abc123'
  propertyIds: text("property_ids").array().notNull().default(sql`'{}'::text[]`), // array of property UUIDs
  locale: text("locale").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export type ShortlistShare = typeof shortlistShares.$inferSelect;
export type NewShortlistShare = typeof shortlistShares.$inferInsert;
