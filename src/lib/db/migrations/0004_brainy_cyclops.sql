CREATE TABLE "communities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"area_id" uuid NOT NULL,
	"name" text NOT NULL,
	"tagline_en" text DEFAULT '' NOT NULL,
	"tagline_es" text DEFAULT '' NOT NULL,
	"description_en" text DEFAULT '' NOT NULL,
	"description_es" text DEFAULT '' NOT NULL,
	"hero_image_url" text,
	"latitude" double precision,
	"longitude" double precision,
	"geo_fence_coords" jsonb,
	"price_min_usd" integer,
	"price_max_usd" integer,
	"listing_count" integer DEFAULT 0 NOT NULL,
	"quick_facts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"site_map_image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "communities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;