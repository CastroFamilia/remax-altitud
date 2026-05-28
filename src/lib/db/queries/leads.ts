/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import { and, desc, eq, gte, lte, inArray, isNull, count } from "drizzle-orm";
import { agents } from "@/lib/db/schema/agents";
import { properties } from "@/lib/db/schema/properties";
import { leadAssignmentLogs } from "@/lib/db/schema/lead-assignment-logs";
import { db } from "@/lib/db/client";
import { leads } from "@/lib/db/schema/leads";
import { encryptField, decryptField, hashField } from "@/lib/utils/encryption";

/**
 * Lead query functions — Story 5.3
 *
 * Handles lead CRUD with transparent PII encryption/decryption.
 * Phone/email are encrypted before insert; decrypted on read.
 * Phone hash (SHA-256) is stored for dedup lookups.
 */

export interface CreateLeadInput {
  name: string;
  phone: string; // plaintext — will be encrypted
  email?: string | null; // plaintext — will be encrypted
  source: string;
  intent: string;
  language?: string | null;
  assignedAgentId?: string | null;
  propertyId?: string | null;
  shortlistPropertyIds?: string[];
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  notes?: string | null;
  status?: string;
}

/**
 * Creates a new lead record with encrypted phone and email.
 * Returns the inserted lead with id and assignedAgentId.
 */
export async function createLead(data: CreateLeadInput) {
  const encryptedPhone = encryptField(data.phone);
  const encryptedEmail = data.email ? encryptField(data.email) : null;
  const phoneHash = hashField(data.phone);

  const [lead] = await db
    .insert(leads)
    .values({
      name: data.name,
      phone: encryptedPhone,
      phoneHash,
      email: encryptedEmail,
      source: data.source,
      intent: data.intent,
      language: data.language ?? null,
      assignedAgentId: data.assignedAgentId ?? null,
      propertyId: data.propertyId ?? null,
      shortlistPropertyIds: data.shortlistPropertyIds ?? [],
      utmSource: data.utmSource ?? null,
      utmMedium: data.utmMedium ?? null,
      utmCampaign: data.utmCampaign ?? null,
      referrer: data.referrer ?? null,
      notes: data.notes ?? null,
      status: data.status ?? "new",
    })
    .returning({
      id: leads.id,
      assignedAgentId: leads.assignedAgentId,
    });

  return lead;
}

/**
 * Checks for a duplicate lead submission within the given time window.
 * Uses phone_hash (SHA-256) for deterministic comparison since
 * encrypted phone values use random IVs.
 *
 * @param phone - Raw phone number (will be hashed for lookup)
 * @param source - Lead source to match
 * @param windowSeconds - Dedup window in seconds (default 60)
 */
export async function findRecentDuplicate(
  phone: string,
  source: string,
  windowSeconds: number = 60,
) {
  const phoneHashValue = hashField(phone);
  const windowStart = new Date(Date.now() - windowSeconds * 1000);

  const rows = await db
    .select({ id: leads.id })
    .from(leads)
    .where(
      and(
        eq(leads.phoneHash, phoneHashValue),
        eq(leads.source, source),
        gte(leads.createdAt, windowStart),
      ),
    )
    .orderBy(desc(leads.createdAt))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Fetches a lead by ID and decrypts PII fields.
 * For future admin use.
 */
export async function getLeadById(id: string) {
  const rows = await db.select().from(leads).where(eq(leads.id, id)).limit(1);

  if (rows.length === 0) return null;

  const lead = rows[0];
  return {
    ...lead,
    phone: decryptField(lead.phone),
    email: lead.email ? decryptField(lead.email) : null,
  };
}

/**
 * getShortlistLeadDetails — Story 7.4
 * Groups lead's shortlisted properties by their listing agents.
 */
export async function getShortlistLeadDetails(leadId: string): Promise<any> {
  const leadRows = await db.select().from(leads).where(eq(leads.id, leadId));
  if (leadRows.length === 0) return null;
  const lead = {
    ...leadRows[0],
    phone: decryptField(leadRows[0].phone),
    email: leadRows[0].email ? decryptField(leadRows[0].email) : null,
  };

  const propIds = lead.shortlistPropertyIds || [];
  if (propIds.length === 0) {
    return {
      ...lead,
      groupedDetails: {
        assignedAgentListings: [],
        otherAgentListings: [],
      },
    };
  }

  const { properties } = await import("@/lib/db/schema/properties");
  const { agents } = await import("@/lib/db/schema/agents");
  const { inArray } = await import("drizzle-orm");

  const propRows = await db
    .select({
      properties: {
        id: properties.id,
        titleEn: properties.titleEn,
        titleEs: properties.titleEs,
        apiId: properties.apiId,
        agentId: properties.agentId,
      },
      agents: {
        id: agents.id,
        name: agents.name,
      },
    })
    .from(properties)
    .leftJoin(agents, eq(properties.agentId, agents.id))
    .where(inArray(properties.id, propIds));

  const assignedAgentListings: any[] = [];
  const otherAgentListings: any[] = [];

  for (const row of propRows) {
    const propObj = {
      id: row.properties.id,
      titleEn: row.properties.titleEn,
      titleEs: row.properties.titleEs,
      apiId: row.properties.apiId,
      agentId: row.properties.agentId,
    };

    if (row.properties.agentId === lead.assignedAgentId) {
      assignedAgentListings.push(propObj);
    } else {
      otherAgentListings.push({
        ...propObj,
        agentName: row.agents?.name || "",
      });
    }
  }

  return {
    ...lead,
    groupedDetails: {
      assignedAgentListings,
      otherAgentListings,
    },
  };
}

export interface GetLeadsFilters {
  agentId?: string;
  source?: string;
  intent?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * getLeads — Story 8.2 (AC 1, AC 4, AC 5)
 * Fetches leads with filtering and pagination, decrypting PII.
 */
export async function getLeads(filters: GetLeadsFilters) {
  const conditions = [];

  if (filters.agentId && filters.agentId !== "all" && filters.agentId !== "none") {
    if (filters.agentId === "unassigned") {
      conditions.push(isNull(leads.assignedAgentId));
    } else {
      conditions.push(eq(leads.assignedAgentId, filters.agentId));
    }
  }
  if (filters.source && filters.source !== "all") {
    conditions.push(eq(leads.source, filters.source));
  }
  if (filters.intent && filters.intent !== "all") {
    conditions.push(eq(leads.intent, filters.intent));
  }
  if (filters.status && filters.status !== "all") {
    conditions.push(eq(leads.status, filters.status));
  }
  if (filters.startDate) {
    conditions.push(gte(leads.createdAt, filters.startDate));
  }
  if (filters.endDate) {
    conditions.push(lte(leads.createdAt, filters.endDate));
  }

  const query = db
    .select({
      lead: leads,
      agentName: agents.name,
      propertyApiId: properties.apiId,
    })
    .from(leads)
    .leftJoin(agents, eq(leads.assignedAgentId, agents.id))
    .leftJoin(properties, eq(leads.propertyId, properties.id));

  if (conditions.length > 0) {
    query.where(and(...conditions));
  }

  const limit = filters.limit ?? 20;
  const offset = filters.offset ?? 0;

  const rows = await query.orderBy(desc(leads.createdAt)).limit(limit).offset(offset);

  return rows.map((row) => {
    return {
      ...row.lead,
      agentName: row.agentName,
      propertyApiId: row.propertyApiId,
      phone: decryptField(row.lead.phone),
      email: row.lead.email ? decryptField(row.lead.email) : null,
    };
  });
}

/**
 * reassignLead — Story 8.2 (AC 3)
 * Updates the assigned coordinator agent for a lead and logs the action.
 */
export async function reassignLead(leadId: string, newAgentId: string | null) {
  const leadRows = await db
    .select({ assignedAgentId: leads.assignedAgentId })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);

  if (leadRows.length === 0) {
    throw new Error("Lead not found");
  }

  const previousAgentId = leadRows[0].assignedAgentId;

  await db.update(leads).set({ assignedAgentId: newAgentId }).where(eq(leads.id, leadId));

  await db.insert(leadAssignmentLogs).values({
    leadId,
    previousAgentId,
    newAgentId,
  });

  return { success: true };
}

/**
 * getLeadAssignmentLogs — Story 8.2 (AC 3)
 * Retrieves lead assignment history logs for administrative auditing.
 */
export async function getLeadAssignmentLogs() {
  const logsList = await db
    .select()
    .from(leadAssignmentLogs)
    .orderBy(desc(leadAssignmentLogs.createdAt));

  const leadIds = [...new Set(logsList.map((l) => l.leadId))];
  const agentIds = [
    ...new Set([
      ...logsList.map((l) => l.previousAgentId).filter(Boolean),
      ...logsList.map((l) => l.newAgentId).filter(Boolean),
    ]),
  ] as string[];

  const [leadsList, agentsList] = await Promise.all([
    leadIds.length > 0
      ? db.select({ id: leads.id, name: leads.name }).from(leads).where(inArray(leads.id, leadIds))
      : [],
    agentIds.length > 0
      ? db
          .select({ id: agents.id, name: agents.name })
          .from(agents)
          .where(inArray(agents.id, agentIds))
      : [],
  ]);

  const leadsMap = new Map(leadsList.map((l) => [l.id, l.name]));
  const agentsMap = new Map(agentsList.map((a) => [a.id, a.name]));

  return logsList.map((log) => ({
    id: log.id,
    leadId: log.leadId,
    leadName: leadsMap.get(log.leadId) || "Unknown Lead",
    previousAgentId: log.previousAgentId,
    previousAgentName: log.previousAgentId
      ? agentsMap.get(log.previousAgentId) || "Unknown Agent"
      : "Unassigned",
    newAgentId: log.newAgentId,
    newAgentName: log.newAgentId ? agentsMap.get(log.newAgentId) || "Unknown Agent" : "Unassigned",
    createdAt: log.createdAt,
  }));
}

/**
 * Helper to safely decrypt values, falling back to plaintext on error or nulls.
 */
function safeDecrypt(val: string | null | undefined): string | null {
  if (!val) return null;
  try {
    return decryptField(val);
  } catch {
    return val;
  }
}

/**
 * bulkReassignLeads — Story 8.3 (AC 1, 2, 3, 5, 7)
 * Bulk reassigns leads from a source agent to target agent(s) using round-robin distribution.
 * Implemented inside a transaction and records assignment logs.
 */
export async function bulkReassignLeads(sourceAgentId: string, targetAgentIds: string[]) {
  const filteredTargetAgentIds = (targetAgentIds || []).filter((id) => id !== sourceAgentId);
  if (filteredTargetAgentIds.length === 0) {
    throw new Error(
      "No valid target agents selected for reassignment (leads cannot be reassigned back to the source agent)",
    );
  }

  return await db.transaction(async (tx) => {
    // 1. Get source agent name for descriptive error validation
    const agentRows = await tx
      .select({ name: agents.name })
      .from(agents)
      .where(eq(agents.id, sourceAgentId))
      .limit(1);

    const sourceAgentName = agentRows[0]?.name || "Unknown Agent";

    // 2. Retrieve all leads for the source agent (using FOR UPDATE to prevent race conditions)
    const leadRows = await tx
      .select({ id: leads.id })
      .from(leads)
      .where(eq(leads.assignedAgentId, sourceAgentId))
      .for("update");

    if (leadRows.length === 0) {
      throw new Error(`No leads to reassign for ${sourceAgentName}`);
    }

    // 3. Group updates and logs by targetAgentId to minimize database roundtrips and lock contention
    const updatesMap = new Map<string, string[]>();
    const logsToInsert: {
      leadId: string;
      previousAgentId: string;
      newAgentId: string;
      createdAt: Date;
    }[] = [];
    const now = new Date();

    for (let i = 0; i < leadRows.length; i++) {
      const leadId = leadRows[i].id;
      const targetAgentId = filteredTargetAgentIds[i % filteredTargetAgentIds.length];

      if (!updatesMap.has(targetAgentId)) {
        updatesMap.set(targetAgentId, []);
      }
      updatesMap.get(targetAgentId)!.push(leadId);

      logsToInsert.push({
        leadId,
        previousAgentId: sourceAgentId,
        newAgentId: targetAgentId,
        createdAt: now,
      });
    }

    // Perform grouped update queries instead of N individual updates
    for (const [targetAgentId, leadIds] of updatesMap.entries()) {
      await tx
        .update(leads)
        .set({ assignedAgentId: targetAgentId })
        .where(inArray(leads.id, leadIds));
    }

    // Bulk insert all assignment log entries in a single query
    if (logsToInsert.length > 0) {
      await tx.insert(leadAssignmentLogs).values(logsToInsert);
    }

    return { success: true, count: leadRows.length };
  });
}

/**
 * getLeadsForExport — Story 8.3 (AC 4)
 * Fetches all leads for a specific agent and decrypts their PII fields.
 */
export async function getLeadsForExport(agentId: string) {
  const rows = await db
    .select()
    .from(leads)
    .where(eq(leads.assignedAgentId, agentId))
    .orderBy(desc(leads.createdAt));

  return rows.map((lead) => ({
    ...lead,
    phone: safeDecrypt(lead.phone) || "",
    email: safeDecrypt(lead.email),
  }));
}

/**
 * getAgentLeadsCount — Story 8.3
 * Returns the total number of leads assigned to a specific agent.
 */
export async function getAgentLeadsCount(agentId: string) {
  const [row] = await db
    .select({ count: count() })
    .from(leads)
    .where(eq(leads.assignedAgentId, agentId));
  return row?.count || 0;
}
