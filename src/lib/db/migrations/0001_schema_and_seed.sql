CREATE TABLE "offices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_guid" text NOT NULL,
	"name" text NOT NULL,
	"area" text NOT NULL,
	"phone" text,
	"email" text,
	"address" text,
	"latitude" double precision,
	"longitude" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "offices_api_guid_unique" UNIQUE("api_guid")
);
--> statement-breakpoint
CREATE TABLE "areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_es" text NOT NULL,
	"region" text NOT NULL,
	"description_en" text DEFAULT '' NOT NULL,
	"description_es" text DEFAULT '' NOT NULL,
	"hero_image_url" text,
	"province" text,
	"canton" text,
	"district" text,
	"latitude" double precision,
	"longitude" double precision,
	"property_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "areas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_id" text NOT NULL,
	"office_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"whatsapp" text,
	"photo_url" text,
	"photo_optimized_url" text,
	"languages" text[] DEFAULT '{}'::text[] NOT NULL,
	"specializations" text[] DEFAULT '{}'::text[] NOT NULL,
	"bio_en" text DEFAULT '' NOT NULL,
	"bio_es" text DEFAULT '' NOT NULL,
	"listing_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agents_api_id_unique" UNIQUE("api_id"),
	CONSTRAINT "agents_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_id" text NOT NULL,
	"office_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"property_type" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"price_usd" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"bedrooms" integer,
	"bathrooms" integer,
	"lot_size_m2" double precision,
	"construction_m2" double precision,
	"latitude" double precision,
	"longitude" double precision,
	"geo" geography(Point, 4326),
	"zmt_status" text DEFAULT 'titled' NOT NULL,
	"lifestyle_tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"community_id" uuid,
	"area_id" uuid,
	"area_slug" text,
	"agent_id" uuid,
	"amenities" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"youtube_url" text,
	"title_en" text NOT NULL,
	"title_es" text NOT NULL,
	"description_en" text DEFAULT '' NOT NULL,
	"description_es" text DEFAULT '' NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"days_on_market" integer,
	"api_hash" text,
	"api_raw" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "properties_api_id_unique" UNIQUE("api_id"),
	CONSTRAINT "properties_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"status" text NOT NULL,
	"properties_fetched" integer DEFAULT 0 NOT NULL,
	"properties_created" integer DEFAULT 0 NOT NULL,
	"properties_updated" integer DEFAULT 0 NOT NULL,
	"properties_removed" integer DEFAULT 0 NOT NULL,
	"agents_synced" integer DEFAULT 0 NOT NULL,
	"translations_queued" integer DEFAULT 0 NOT NULL,
	"images_optimized" integer DEFAULT 0 NOT NULL,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"error_message" text,
	"office_guid" text,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_agents_office" ON "agents" USING btree ("office_id");--> statement-breakpoint
CREATE INDEX "idx_properties_geo" ON "properties" USING gist ("geo");--> statement-breakpoint
CREATE INDEX "idx_properties_tags" ON "properties" USING gin ("lifestyle_tags");--> statement-breakpoint
CREATE INDEX "idx_properties_search" ON "properties" USING btree ("is_visible","property_type","price_usd","area_slug") WHERE "properties"."is_visible" = true;--> statement-breakpoint
CREATE INDEX "idx_properties_community" ON "properties" USING btree ("community_id") WHERE "properties"."community_id" IS NOT NULL;--> statement-breakpoint
INSERT INTO "offices" ("api_guid", "name", "area") VALUES
  ('FEA8746D-CC1D-41B8-89F3-D04AC98274AF', 'RE/MAX Altitud', 'Pérez Zeledón'),
  ('4AD5AE8F-5B47-4A1A-A953-40445F2B4940', 'RE/MAX Altitud Cero', 'Dominical/Uvita')
ON CONFLICT ("api_guid") DO NOTHING;
