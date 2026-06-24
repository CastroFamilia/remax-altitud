import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { properties } from "./properties";

export const propertyViews = pgTable(
  "property_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    propertyIdx: index("idx_property_views_prop").on(table.propertyId, table.createdAt),
    createdIdx: index("idx_property_views_created").on(table.createdAt),
  }),
);

export type PropertyView = typeof propertyViews.$inferSelect;
export type NewPropertyView = typeof propertyViews.$inferInsert;
