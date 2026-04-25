import { sql } from "drizzle-orm";
import {
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/** Geographic areas (mountain / coast) used to scope properties and area guides. */
export const areas = pgTable("areas", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameEs: text("name_es").notNull(),
  region: text("region").notNull(),
  descriptionEn: text("description_en").notNull().default(""),
  descriptionEs: text("description_es").notNull().default(""),
  heroImageUrl: text("hero_image_url"),
  province: text("province"),
  canton: text("canton"),
  district: text("district"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  propertyCount: integer("property_count").notNull().default(0),
  metadata: jsonb("metadata")
    .notNull()
    .default(sql`'{}'::jsonb`),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Area = typeof areas.$inferSelect;
export type NewArea = typeof areas.$inferInsert;
