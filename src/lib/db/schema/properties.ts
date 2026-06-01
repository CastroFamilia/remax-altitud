import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { geographyPoint } from "../types/postgis";
import { agents } from "./agents";
import { areas } from "./areas";
import { offices } from "./offices";

/** Canonical property listings synced from the REMAX CCA API. */
export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    apiId: text("api_id").notNull().unique(),
    officeId: uuid("office_id")
      .notNull()
      .references(() => offices.id),
    slug: text("slug").notNull().unique(),
    propertyType: text("property_type").notNull(),
    listingType: text("listing_type").notNull().default("Sale"),
    status: text("status").notNull().default("active"),
    priceUsd: integer("price_usd").notNull(),
    currency: text("currency").notNull().default("USD"),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    lotSizeM2: doublePrecision("lot_size_m2"),
    constructionM2: doublePrecision("construction_m2"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    geo: geographyPoint("geo"),
    zmtStatus: text("zmt_status").notNull().default("titled"),
    lifestyleTags: text("lifestyle_tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    communityId: uuid("community_id"),
    areaId: uuid("area_id").references(() => areas.id, { onDelete: "set null" }),
    areaSlug: text("area_slug"),
    subLocation: text("sub_location"),
    agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
    amenities: jsonb("amenities")
      .notNull()
      .default(sql`'{}'::jsonb`),
    images: jsonb("images")
      .notNull()
      .default(sql`'[]'::jsonb`),
    youtubeUrl: text("youtube_url"),
    titleEn: text("title_en").notNull(),
    titleEs: text("title_es").notNull(),
    descriptionEn: text("description_en").notNull().default(""),
    descriptionEs: text("description_es").notNull().default(""),
    isVisible: boolean("is_visible").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    daysOnMarket: integer("days_on_market"),
    apiHash: text("api_hash"),
    apiRaw: jsonb("api_raw")
      .notNull()
      .default(sql`'{}'::jsonb`),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    geoIdx: index("idx_properties_geo").using("gist", table.geo),
    tagsIdx: index("idx_properties_tags").using("gin", table.lifestyleTags),
    searchIdx: index("idx_properties_search")
      .on(table.isVisible, table.propertyType, table.priceUsd, table.areaSlug, table.listingType)
      .where(sql`${table.isVisible} = true`),
    communityIdx: index("idx_properties_community")
      .on(table.communityId)
      .where(sql`${table.communityId} IS NOT NULL`),
  }),
);

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
