"use client";

import React, { useState } from "react";
import { fetchShortlistDetailsAction, reassignLeadAction } from "@/app/actions/admin-lead-actions";
import { UserCheck, ShieldAlert, BookOpen, Loader2 } from "lucide-react";

interface Agent {
  id: string;
  name: string;
}

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  source: string;
  intent: string;
  status: string;
  language: string;
  assignedAgentId: string | null;
  agentName: string | null;
  propertyApiId: string | null;
  shortlistPropertyIds: string[] | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: Date;
}

interface AdminLeadsTableProps {
  locale: string;
  leads: Lead[];
  agents: Agent[];
}

export function AdminLeadsTable({ locale, leads, agents }: AdminLeadsTableProps) {
  // Reassign state
  const [reassigningLeadId, setReassigningLeadId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("unassigned");
  const [isSubmitReassign, setIsSubmitReassign] = useState(false);

  // Shortlist details state
  const [shortlistDetails, setShortlistDetails] = useState<Record<string, any>>({});
  const [loadingShortlistId, setLoadingShortlistId] = useState<string | null>(null);

  const handleOpenReassign = (lead: Lead) => {
    setReassigningLeadId(lead.id);
    setSelectedAgentId(lead.assignedAgentId || "unassigned");
  };

  const handleConfirmReassign = async (leadId: string) => {
    setIsSubmitReassign(true);
    try {
      const agentVal = selectedAgentId === "unassigned" ? null : selectedAgentId;
      await reassignLeadAction(leadId, agentVal, locale);
      setReassigningLeadId(null);
    } catch (err) {
      console.error("Failed to reassign lead", err);
    } finally {
      setIsSubmitReassign(false);
    }
  };

  const handleFetchShortlist = async (leadId: string) => {
    if (shortlistDetails[leadId]) {
      // Toggle off if already loaded
      const updated = { ...shortlistDetails };
      delete updated[leadId];
      setShortlistDetails(updated);
      return;
    }

    setLoadingShortlistId(leadId);
    try {
      const data = await fetchShortlistDetailsAction(leadId);
      setShortlistDetails((prev) => ({
        ...prev,
        [leadId]: data,
      }));
    } catch (err) {
      console.error("Failed to fetch shortlist", err);
    } finally {
      setLoadingShortlistId(null);
    }
  };

  const formatShortlistText = (details: any) => {
    if (!details || !details.groupedDetails) {
      return "No details available";
    }
    const parts: string[] = [];

    // Assigned Agent Listings
    const assignedListings = details.groupedDetails.assignedAgentListings || [];
    if (assignedListings.length > 0) {
      const agentName = details.agentName || "Assigned Agent";
      const refs = assignedListings
        .map((p: any) => `#${p.apiId || p.id}`)
        .join(", ");
      parts.push(`${agentName}'s: ${refs}`);
    }

    // Other Agent Listings grouped by listing agent name
    const othersByAgent: Record<string, any[]> = {};
    const otherListings = details.groupedDetails.otherAgentListings || [];
    otherListings.forEach((p: any) => {
      const name = p.agentName || "Other Agent";
      if (!othersByAgent[name]) {
        othersByAgent[name] = [];
      }
      othersByAgent[name].push(p);
    });

    Object.entries(othersByAgent).forEach(([name, props]) => {
      const refs = props.map((p: any) => `#${p.apiId || p.id}`).join(", ");
      parts.push(`${name}'s: ${refs}`);
    });

    return parts.join(" | ") || "No listings in shortlist";
  };

  if (leads.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="font-semibold text-lg text-slate-300">No leads found</p>
        <p className="text-sm text-slate-500 mt-1">Try adjusting your filter options above.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Lead</th>
              <th className="px-6 py-4">Status & Language</th>
              <th className="px-6 py-4">Details</th>
              <th className="px-6 py-4">utm info</th>
              <th className="px-6 py-4">Shortlist</th>
              <th className="px-6 py-4">Assigned Agent</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
            {leads.map((lead, idx) => {
              const hasShortlist = lead.shortlistPropertyIds && lead.shortlistPropertyIds.length > 0;
              const hasShortlistLoaded = !!shortlistDetails[lead.id];
              const isEditing = reassigningLeadId === lead.id;

              return (
                <tr
                  key={lead.id}
                  data-testid={idx === 0 ? "lead-row-1" : `lead-row-${lead.id}`}
                  className="lead-row hover:bg-slate-800/40 transition-colors"
                >
                  {/* Lead Info */}
                  <td className="px-6 py-4 lead-name lead-email lead-phone">
                    <div className="font-semibold text-slate-100">{lead.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{lead.email || "No Email"}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{lead.phone}</div>
                  </td>

                  {/* Status & Language */}
                  <td className="px-6 py-4 lead-language lead-status">
                    <div className="flex flex-col gap-1.5">
                      <span
                        className={`inline-block text-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          lead.status === "new"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : lead.status === "contacted"
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            : lead.status === "qualified"
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            : "bg-green-500/20 text-green-400 border border-green-500/30"
                        }`}
                      >
                        {lead.status}
                      </span>
                      <span className="text-xs text-slate-500">
                        Language: <span className="font-semibold uppercase">{lead.language}</span>
                      </span>
                    </div>
                  </td>

                  {/* Intent & Source */}
                  <td className="px-6 py-4 lead-source lead-intent lead-property-ref">
                    <div className="text-xs text-slate-400">
                      Source: <span className="font-semibold text-slate-300 capitalize">{lead.source}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Intent: <span className="font-semibold text-slate-300 capitalize">{lead.intent}</span>
                    </div>
                    {lead.propertyApiId && (
                      <div className="text-[11px] text-red-400 mt-1">
                        Property Ref: <span className="font-mono font-bold">#{lead.propertyApiId}</span>
                      </div>
                    )}
                  </td>

                  {/* UTM Info */}
                  <td className="px-6 py-4 text-xs font-mono text-slate-500 lead-utm">
                    <div>src: {lead.utmSource || "-"}</div>
                    <div>med: {lead.utmMedium || "-"}</div>
                    <div>cam: {lead.utmCampaign || "-"}</div>
                  </td>

                  {/* Shortlist Button & Details */}
                  <td className="px-6 py-4 lead-shortlist">
                    {hasShortlist ? (
                      <div className="space-y-2">
                        <button
                          data-testid="view-shortlist"
                          onClick={() => handleFetchShortlist(lead.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-all text-xs font-semibold cursor-pointer"
                        >
                          {loadingShortlistId === lead.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                          )}
                          <span>
                            {hasShortlistLoaded ? "Hide Shortlist" : `View Shortlist (${lead.shortlistPropertyIds?.length})`}
                          </span>
                        </button>

                        {hasShortlistLoaded && (
                          <div
                            data-testid="shortlist-details"
                            className="bg-slate-950 border border-slate-800 text-[11px] text-slate-300 p-2.5 rounded-lg font-semibold max-w-xs leading-relaxed"
                          >
                            {formatShortlistText(shortlistDetails[lead.id])}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-xs italic">No Shortlist</span>
                    )}
                  </td>

                  {/* Assigned Agent */}
                  <td className="px-6 py-4 lead-assigned-agent">
                    {isEditing ? (
                      <div className="space-y-2 min-w-[160px]">
                        <select
                          data-testid="agent-select"
                          value={selectedAgentId}
                          onChange={(e) => setSelectedAgentId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                        >
                          <option value="unassigned">Unassigned</option>
                          {agents.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>

                        <div className="flex gap-2">
                          <button
                            data-testid="confirm-reassign"
                            disabled={isSubmitReassign}
                            onClick={() => handleConfirmReassign(lead.id)}
                            className="flex-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {isSubmitReassign ? "Saving..." : "Confirm"}
                          </button>
                          <button
                            onClick={() => setReassigningLeadId(null)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-[11px] transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-200">
                          {lead.agentName || "Unassigned"}
                        </span>
                        {lead.agentName && (
                          <span className="text-[10px] text-slate-500 uppercase font-mono">
                            ID: {lead.assignedAgentId}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-4 text-right lead-created-at">
                    {!isEditing && (
                      <button
                        data-testid="reassign-lead"
                        onClick={() => handleOpenReassign(lead)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Reassign</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
