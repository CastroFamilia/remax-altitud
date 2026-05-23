CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text NOT NULL,
	"phone_hash" text NOT NULL,
	"source" text NOT NULL,
	"intent" text NOT NULL,
	"language" text,
	"assigned_agent_id" uuid,
	"property_id" uuid,
	"shortlist_property_ids" text[] DEFAULT '{}'::text[] NOT NULL,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"referrer" text,
	"notes" text,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_agent_id_agents_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_leads_agent" ON "leads" USING btree ("assigned_agent_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_leads_dedup" ON "leads" USING btree ("phone_hash","source","created_at");