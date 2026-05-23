import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { agents } from "./agents";
import { properties } from "./properties";

/**
 * Leads table — Story 5.3 (AC #3, AC #7)
 *
 * Stores seller/CMA/WhatsApp lead submissions with PII encryption.
 * phone and email columns store AES-256-GCM ciphertext (AR17, NFR9).
 * phone_hash stores SHA-256 of raw phone for idempotency dedup.
 */
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email"), // nullable, encrypted ciphertext
    phone: text("phone").notNull(), // encrypted ciphertext
    phoneHash: text("phone_hash").notNull(), // SHA-256 for dedup
    source: text("source").notNull(), // whatsapp|seller_form|contact_form|cma_form|whatsapp_click
    intent: text("intent").notNull(), // buy|sell|invest|recruit
    language: text("language"),
    assignedAgentId: uuid("assigned_agent_id").references(() => agents.id, {
      onDelete: "set null",
    }),
    propertyId: uuid("property_id").references(() => properties.id, {
      onDelete: "set null",
    }),
    shortlistPropertyIds: text("shortlist_property_ids")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    referrer: text("referrer"),
    notes: text("notes"),
    status: text("status").notNull().default("new"), // new|contacted|qualified|closed
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    agentIdx: index("idx_leads_agent").on(table.assignedAgentId, table.createdAt),
    dedupIdx: index("idx_leads_dedup").on(table.phoneHash, table.source, table.createdAt),
  }),
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
