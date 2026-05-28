import React from "react";
import { setRequestLocale } from "next-intl/server";
import { fetchAdminLeadsData } from "@/app/actions/admin-lead-actions";
import { AdminLeadsFilters } from "@/components/admin/admin-leads-filters";
import { AdminLeadsTable } from "@/components/admin/admin-leads-table";
import { AdminLeadsPagination } from "@/components/admin/admin-leads-pagination";
import { Users, History } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    agentId?: string;
    source?: string;
    intent?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
  }>;
}

export default async function AdminLeadsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const resolvedSearchParams = await searchParams;
  const agentId = resolvedSearchParams.agentId || "";
  const source = resolvedSearchParams.source || "";
  const intent = resolvedSearchParams.intent || "";
  const status = resolvedSearchParams.status || "";
  const startDateStr = resolvedSearchParams.startDate || "";
  const endDateStr = resolvedSearchParams.endDate || "";
  const pageNum = Number(resolvedSearchParams.page || "1");

  const { leads, agents, hasMore } = await fetchAdminLeadsData({
    agentId,
    source,
    intent,
    status,
    startDateStr,
    endDateStr,
    page: pageNum,
  });

  return (
    <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-red-500" />
            <span>Leads & Assignment Management</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor incoming leads, inspect shortlist groups, and reassign agents.
          </p>
        </div>

        <Link
          href={`/${locale}/admin/leads/reassignment-logs`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-semibold text-sm cursor-pointer"
        >
          <History className="w-4 h-4 text-blue-400" />
          <span>View Reassignment History</span>
        </Link>
      </div>

      {/* Filters */}
      <AdminLeadsFilters locale={locale} agents={agents} />

      {/* Table */}
      <AdminLeadsTable locale={locale} leads={leads as any} agents={agents} />

      {/* Pagination */}
      <AdminLeadsPagination locale={locale} currentPage={pageNum} hasMore={hasMore} />
    </div>
  );
}
