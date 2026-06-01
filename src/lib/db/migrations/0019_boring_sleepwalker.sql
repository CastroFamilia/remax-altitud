CREATE TABLE IF NOT EXISTS "shortlist_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"action" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_properties_search";--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "listing_type" text DEFAULT 'Sale' NOT NULL;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "property_types_en" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "property_types_es" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "size_min_m2" double precision;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "size_max_m2" double precision;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "shortlist_events" ADD CONSTRAINT "shortlist_events_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shortlist_events_prop_action" ON "shortlist_events" USING btree ("property_id","action","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shortlist_events_created" ON "shortlist_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_properties_search" ON "properties" USING btree ("is_visible","property_type","price_usd","area_slug","listing_type") WHERE "properties"."is_visible" = true;