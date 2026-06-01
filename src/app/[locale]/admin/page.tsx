import React from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { fetchAdminSyncDashboardData } from "@/app/actions/admin-sync-actions";
import { AdminSyncFilters } from "@/components/admin/admin-sync-filters";
import { AdminSyncLogRow } from "@/components/admin/admin-sync-log-row";
import { AdminSyncPagination } from "@/components/admin/admin-sync-pagination";
import { Database, Home, RefreshCw } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
  }>;
}

export default async function AdminPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const resolvedSearchParams = await searchParams;
  const status = resolvedSearchParams.status || "all";
  const startDateStr = resolvedSearchParams.startDate || "";
  const endDateStr = resolvedSearchParams.endDate || "";
  const pageNum = Number(resolvedSearchParams.page || "1");

  const t = await getTranslations({ locale, namespace: "AdminSync" });

  const { logs, stats, hasMore } = await fetchAdminSyncDashboardData({
    status,
    startDateStr,
    endDateStr,
    page: pageNum,
  });

  const getRelativeTimeString = (date: Date | string | null, neverText: string): string => {
    if (!date) return neverText;
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return neverText;

    const now = new Date();
    const diffMs = now.getTime() - parsedDate.getTime();
    const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return t("justNow");
    if (diffMins < 60) return t("mAgo", { mins: diffMins });
    if (diffHours < 24) return t("hAgo", { hours: diffHours });
    return t("dAgo", { days: diffDays });
  };

  const formattedDate = (date: Date | string | null, neverText: string) => {
    if (!date) return neverText;
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return neverText;

    return parsedDate.toLocaleString(locale, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Build static translation objects for client components to maintain strict type safety and performance
  const filterTranslations = {
    filterTitle: t("filterTitle"),
    startDate: t("startDate"),
    endDate: t("endDate"),
    status: t("status"),
    allStatuses: t("allStatuses"),
    filterButton: t("filterButton"),
    clearFilters: t("clearFilters"),
    running: t("running"),
    success: t("success"),
    failure: t("failure"),
    partial: t("partial"),
  };

  const rowTranslations = {
    startedAt: t("startedAt"),
    completedAt: t("completedAt"),
    duration: t("duration"),
    propertiesAdded: t("propertiesAdded"),
    propertiesUpdated: t("propertiesUpdated"),
    propertiesRemoved: t("propertiesRemoved"),
    agentsSynced: t("agentsSynced"),
    translations: t("translations"),
    images: t("images"),
    errorTitle: t("errorTitle"),
    details: t("details"),
    running: t("running"),
    success: t("success"),
    failure: t("failure"),
    partial: t("partial"),
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <Database className="w-8 h-8 text-red-500" />
          <span>{t("dashboardTitle")}</span>
        </h1>
        <p className="text-slate-400 mt-2 text-sm md:text-base">{t("subtitle")}</p>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Listings Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center gap-5">
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {t("activeListings")}
            </span>
            <span className="text-3xl font-extrabold text-white mt-1 block">
              {stats.activeListings}
            </span>
          </div>
        </div>

        {/* Last Successful Sync Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center gap-5">
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {t("lastSuccess")}
            </span>
            <span className="text-lg font-bold text-white mt-1 block leading-tight">
              {getRelativeTimeString(stats.lastSuccessfulSync, t("lastSuccessNever"))}
            </span>
            {stats.lastSuccessfulSync && (
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {formattedDate(stats.lastSuccessfulSync, "")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filters Form */}
      <AdminSyncFilters locale={locale} translations={filterTranslations} />

      {/* Log list */}
      <div className="space-y-4">
        {logs.length === 0 ? (
          <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-xl p-12 text-center">
            <Database className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 font-semibold">{t("noLogs")}</p>
          </div>
        ) : (
          logs.map((log) => (
            <AdminSyncLogRow
              key={log.id}
              log={log}
              locale={locale}
              translations={rowTranslations}
            />
          ))
        )}
      </div>

      {/* Pagination controls */}
      {logs.length > 0 && (
        <AdminSyncPagination locale={locale} currentPage={pageNum} hasMore={hasMore} />
      )}
    </div>
  );
}
