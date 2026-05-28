"use server";

import {
  getLeads,
  reassignLead,
  getLeadAssignmentLogs,
  getShortlistLeadDetails,
  bulkReassignLeads,
  getLeadsForExport,
  getAgentLeadsCount,
} from "@/lib/db/queries/leads";
import { getAllAgents } from "@/lib/db/queries/agents";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createHash } from "crypto";

/**
 * Helper to enforce admin authorization in server actions.
 */
async function verifyAdminAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  const adminPassword =
    process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? undefined : "admin");
  const expectedSession = adminPassword
    ? createHash("sha256").update(adminPassword).digest("hex")
    : undefined;
  const isAuthenticated = !!expectedSession && session === expectedSession;
  if (!isAuthenticated) {
    throw new Error("Unauthorized");
  }
}

/**
 * Server Action for fetching admin leads with pagination and filtering.
 */
export async function fetchAdminLeadsData(params: {
  agentId?: string;
  source?: string;
  intent?: string;
  status?: string;
  startDateStr?: string;
  endDateStr?: string;
  page?: number;
}) {
  await verifyAdminAuth();

  let page = typeof params.page === "number" ? params.page : parseInt(String(params.page), 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  } else {
    page = Math.trunc(page);
  }

  const limit = 20;
  const offset = (page - 1) * limit;

  let startDate: Date | undefined;
  if (params.startDateStr) {
    const parsed = new Date(params.startDateStr);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 1970 && parsed.getFullYear() <= 2100) {
      startDate = parsed;
    }
  }

  let endDate: Date | undefined;
  if (params.endDateStr) {
    const parsed = new Date(params.endDateStr);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 1970 && parsed.getFullYear() <= 2100) {
      parsed.setUTCHours(23, 59, 59, 999);
      endDate = parsed;
    }
  }

  // Fetch limit + 1 to determine true hasMore status
  const [leadsList, activeAgents] = await Promise.all([
    getLeads({
      agentId: params.agentId || undefined,
      source: params.source || undefined,
      intent: params.intent || undefined,
      status: params.status || undefined,
      startDate,
      endDate,
      limit: limit + 1,
      offset,
    }),
    getAllAgents(),
  ]);

  const hasMore = leadsList.length > limit;
  const slicedLeads = hasMore ? leadsList.slice(0, limit) : leadsList;

  return {
    leads: slicedLeads,
    agents: activeAgents,
    hasMore,
  };
}

/**
 * Server Action to reassign agent of a lead.
 */
export async function reassignLeadAction(
  leadId: string,
  newAgentId: string | null,
  locale: string,
) {
  await verifyAdminAuth();
  const result = await reassignLead(leadId, newAgentId);
  revalidatePath(`/${locale}/admin/leads`);
  return result;
}

/**
 * Server Action to fetch lead assignment history logs.
 */
export async function fetchLeadAssignmentLogsAction() {
  await verifyAdminAuth();
  return getLeadAssignmentLogs();
}

/**
 * Server Action to fetch shortlist lead details.
 */
export async function fetchShortlistDetailsAction(leadId: string) {
  await verifyAdminAuth();
  return getShortlistLeadDetails(leadId);
}

/**
 * Server Action to bulk reassign leads from one agent to other agent(s).
 */
export async function bulkReassignLeadsAction(
  sourceAgentId: string,
  targetAgentIds: string[],
  locale: string,
) {
  await verifyAdminAuth();
  try {
    const result = await bulkReassignLeads(sourceAgentId, targetAgentIds);
    revalidatePath(`/${locale}/admin/leads`);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to bulk reassign leads";
    return { success: false, error: message };
  }
}

/**
 * Server Action to export agent leads as a CSV string.
 */
export async function exportAgentLeadsCSVAction(agentId: string) {
  await verifyAdminAuth();

  const leadsList = await getLeadsForExport(agentId);

  // CSV formatting (RFC 4180 compliant)
  // Headers: Name, Email, Phone
  const headers = ["Name", "Email", "Phone"];

  const escapeCSVField = (val: string | null | undefined): string => {
    if (val === null || val === undefined) {
      return "";
    }
    let escaped = val.replace(/"/g, '""');
    if (
      escaped.includes(",") ||
      escaped.includes('"') ||
      escaped.includes("\n") ||
      escaped.includes("\r")
    ) {
      escaped = `"${escaped}"`;
    }
    return escaped;
  };

  const rows = leadsList.map((lead) => {
    return [escapeCSVField(lead.name), escapeCSVField(lead.email), escapeCSVField(lead.phone)].join(
      ", ",
    );
  });

  return [headers.join(", "), ...rows].join("\n");
}

/**
 * Server Action to fetch lead count for a specific agent.
 */
export async function fetchAgentLeadsCountAction(agentId: string) {
  await verifyAdminAuth();
  return getAgentLeadsCount(agentId);
}
