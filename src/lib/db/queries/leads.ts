/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import { and, desc, eq, gte } from "drizzle-orm";
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

