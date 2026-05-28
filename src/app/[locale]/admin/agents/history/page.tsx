import React from "react";
import { setRequestLocale } from "next-intl/server";
import { getAllAgents } from "@/lib/db/queries/agents";
import { getLeads } from "@/lib/db/queries/leads";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { redirect } from "next/navigation";
import { AdminAgentHistorySelector } from "@/components/admin/admin-agent-history-selector";
import { History, ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    agentId?: string;
  }>;
}

export default async function AgentHistoryPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Authenticate Admin
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  const adminPassword =
    process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? undefined : "admin");
  const expectedSession = adminPassword
    ? createHash("sha256").update(adminPassword).digest("hex")
    : undefined;
  const isAuthenticated = !!expectedSession && session === expectedSession;

  if (!isAuthenticated) {
    redirect(`/${locale}/admin?login=true`);
  }

  const resolvedSearchParams = await searchParams;
  const agentId = resolvedSearchParams.agentId || "";

  const [agents, leads] = await Promise.all([
    getAllAgents(),
    agentId ? getLeads({ agentId }) : Promise.resolve([]),
  ]);

  return (
    <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex items-center gap-2 mb-8">
        <Link
          href={`/${locale}/admin/leads`}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <History className="w-7 h-7 text-red-500" />
            <span>Agent Lead History</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 ml-9">
            Audit history of all leads routed or manually assigned to a specific agent.
          </p>
        </div>
      </div>

      {/* Selector */}
      <AdminAgentHistorySelector
        locale={locale}
        agents={agents}
        selectedAgentId={agentId || "none"}
      />

      {/* History table */}
      {agentId ? (
        leads.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="font-semibold text-lg text-slate-300">No leads found for this agent</p>
            <p className="text-sm text-slate-500 mt-1">This agent hasn't been assigned any leads yet.</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Lead Name</th>
                    <th className="px-6 py-4">Type / Intent</th>
                    <th className="px-6 py-4">Property Ref</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Assigned On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                  {leads.map((lead, idx) => (
                    <tr
                      key={lead.id}
                      data-testid={`history-row-${idx + 1}`}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name */}
                      <td className="lead-name px-6 py-4 font-semibold text-slate-200">
                        {lead.name}
                      </td>

                      {/* Type / Intent */}
                      <td className="lead-type px-6 py-4 capitalize">{lead.intent}</td>

                      {/* Property Ref */}
                      <td className="lead-property-ref px-6 py-4 font-mono font-bold text-red-400">
                        {lead.propertyApiId ? `#${lead.propertyApiId}` : "-"}
                      </td>

                      {/* Source */}
                      <td className="lead-source px-6 py-4 capitalize">{lead.source}</td>

                      {/* Status */}
                      <td className="lead-status px-6 py-4">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
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
                      </td>

                      {/* Assigned On */}
                      <td className="lead-created-at px-6 py-4 text-xs text-slate-500 font-mono">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
          <p className="font-semibold text-slate-300">Please choose an agent from the dropdown above to view their lead history.</p>
        </div>
      )}
    </div>
  );
}
