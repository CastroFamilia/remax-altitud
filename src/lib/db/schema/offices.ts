import { doublePrecision, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** REMAX Altitud offices. Two rows are seeded by the initial migration with the GUIDs from `.env.example` (PZ_OFFICE_GUID / DOM_OFFICE_GUID). */
export const offices = pgTable("offices", {
  id: uuid("id").primaryKey().defaultRandom(),
  apiGuid: text("api_guid").notNull().unique(),
  name: text("name").notNull(),
  area: text("area").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Office = typeof offices.$inferSelect;
export type NewOffice = typeof offices.$inferInsert;
