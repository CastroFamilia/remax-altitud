import React from "react";
import { setRequestLocale } from "next-intl/server";
import { fetchLeadAssignmentLogsAction } from "@/app/actions/admin-lead-actions";
import { History, ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ReassignmentLogsPage({ params }: PageProps) {
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


  const logs = await fetchLeadAssignmentLogsAction();

  return (
    <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/admin/leads`}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <History className="w-7 h-7 text-blue-500" />
              <span>Lead Reassignment History</span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1 ml-7">
            Auditing trail of agent reassignments and coordinator changes.
          </p>
        </div>
      </div>

      {/* Logs Table */}
      {logs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
          <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="font-semibold text-lg text-slate-300">No logs found</p>
          <p className="text-sm text-slate-500 mt-1">Reassignment events will be listed here.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Lead</th>
                  <th className="px-6 py-4">Previous Agent</th>
                  <th className="px-6 py-4">New Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                {logs.map((log) => (
                  <tr key={log.id} data-testid="log-entry" className="hover:bg-slate-800/40 transition-colors">
                    {/* Timestamp */}
                    <td className="px-6 py-4 font-mono text-slate-400 text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    {/* Lead */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{log.leadName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">ID: {log.leadId}</div>
                    </td>

                    {/* Previous Agent */}
                    <td className="px-6 py-4">
                      <div className="text-slate-300 font-medium">{log.previousAgentName}</div>
                      {log.previousAgentId && (
                        <div className="text-[10px] text-slate-500 font-mono">ID: {log.previousAgentId}</div>
                      )}
                    </td>

                    {/* New Agent */}
                    <td className="px-6 py-4">
                      <div className="text-red-400 font-bold">{log.newAgentName}</div>
                      {log.newAgentId && (
                        <div className="text-[10px] text-slate-500 font-mono">ID: {log.newAgentId}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
