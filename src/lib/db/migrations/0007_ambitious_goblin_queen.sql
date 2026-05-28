CREATE TABLE "lead_assignment_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"previous_agent_id" uuid,
	"new_agent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_assignment_logs" ADD CONSTRAINT "lead_assignment_logs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignment_logs" ADD CONSTRAINT "lead_assignment_logs_previous_agent_id_agents_id_fk" FOREIGN KEY ("previous_agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignment_logs" ADD CONSTRAINT "lead_assignment_logs_new_agent_id_agents_id_fk" FOREIGN KEY ("new_agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;