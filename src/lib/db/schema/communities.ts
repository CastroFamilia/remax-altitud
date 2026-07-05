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
import { areas } from "./areas";
import { geographyPolygon } from "../types/postgis";

/** Curated community developments (RISE, Santa Elena Hills, etc.) */
export const communities = pgTable("communities", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  areaId: uuid("area_id")
    .notNull()
    .references(() => areas.id),
  name: text("name").notNull(),
  taglineEn: text("tagline_en").notNull().default(""),
  taglineEs: text("tagline_es").notNull().default(""),
  descriptionEn: text("description_en").notNull().default(""),
  descriptionEs: text("description_es").notNull().default(""),
  heroImageUrl: text("hero_image_url"),
  // geo_fence — Polygon 4326 for geo-fence matching (Story 6.5)
  // Placeholder: null until geo-fence data is populated
  geoFence: geographyPolygon("geo_fence"),
  /** Community center-point latitude for mini-map pin (Story 6.3) */
  latitude: doublePrecision("latitude"),
  /** Community center-point longitude for mini-map pin (Story 6.3) */
  longitude: doublePrecision("longitude"),
  /** GeoJSON polygon coordinates for display-only geo-fence overlay (Story 6.3) */
  geoFenceCoords: jsonb("geo_fence_coords"),
  priceMinUsd: integer("price_min_usd"),
  priceMaxUsd: integer("price_max_usd"),
  listingCount: integer("listing_count").notNull().default(0),
  propertyTypesEn: text("property_types_en").notNull().default(""),
  propertyTypesEs: text("property_types_es").notNull().default(""),
  sizeMinM2: doublePrecision("size_min_m2"),
  sizeMaxM2: doublePrecision("size_max_m2"),
  quickFacts: jsonb("quick_facts")
    .notNull()
    .default(sql`'{}'::jsonb`),
  siteMapImageUrl: text("site_map_image_url"),
  heroImage: jsonb("hero_image"),
  siteMapImage: jsonb("site_map_image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Community = typeof communities.$inferSelect;
export type NewCommunity = typeof communities.$inferInsert;
