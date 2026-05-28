"use server";

import { getLeads, reassignLead, getLeadAssignmentLogs, getShortlistLeadDetails } from "@/lib/db/queries/leads";
import { getAllAgents } from "@/lib/db/queries/agents";
import { revalidatePath } from "next/cache";

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
export async function reassignLeadAction(leadId: string, newAgentId: string | null, locale: string) {
  const result = await reassignLead(leadId, newAgentId);
  revalidatePath(`/${locale}/admin/leads`);
  return result;
}

/**
 * Server Action to fetch lead assignment history logs.
 */
export async function fetchLeadAssignmentLogsAction() {
  return getLeadAssignmentLogs();
}

/**
 * Server Action to fetch shortlist lead details.
 */
export async function fetchShortlistDetailsAction(leadId: string) {
  return getShortlistLeadDetails(leadId);
}

