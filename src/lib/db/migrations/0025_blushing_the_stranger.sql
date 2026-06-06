ALTER TABLE "communities" ADD COLUMN "sub_location" text;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "gallery_urls" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "price_list_url" text;