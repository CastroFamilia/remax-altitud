import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { leads } from "./leads";
import { agents } from "./agents";

export const leadAssignmentLogs = pgTable("lead_assignment_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  previousAgentId: uuid("previous_agent_id")
    .references(() => agents.id, { onDelete: "set null" }),
  newAgentId: uuid("new_agent_id")
    .references(() => agents.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type LeadAssignmentLog = typeof leadAssignmentLogs.$inferSelect;
export type NewLeadAssignmentLog = typeof leadAssignmentLogs.$inferInsert;
