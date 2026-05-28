import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { properties } from "./properties";

export const shortlistEvents = pgTable(
  "shortlist_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    action: text("action").notNull(), // 'save' | 'unsave'
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    propertyActionIdx: index("idx_shortlist_events_prop_action").on(table.propertyId, table.action, table.createdAt),
    createdIdx: index("idx_shortlist_events_created").on(table.createdAt),
  })
);

export type ShortlistEvent = typeof shortlistEvents.$inferSelect;
export type NewShortlistEvent = typeof shortlistEvents.$inferInsert;
