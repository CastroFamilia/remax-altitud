import { sql } from "drizzle-orm";
import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { offices } from "./offices";

/** REMAX agents exposed publicly. Privacy-sensitive fields (e.g. birthday) are intentionally excluded per API9. */
export const agents = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    apiId: text("api_id").notNull().unique(),
    officeId: uuid("office_id")
      .notNull()
      .references(() => offices.id),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    photoUrl: text("photo_url"),
    photoOptimizedUrl: text("photo_optimized_url"),
    languages: text("languages")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    specializations: text("specializations")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    bioEn: text("bio_en").notNull().default(""),
    bioEs: text("bio_es").notNull().default(""),
    videoUrl: text("video_url"),
    listingCount: integer("listing_count").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    officeIdx: index("idx_agents_office").on(table.officeId),
  }),
);

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
