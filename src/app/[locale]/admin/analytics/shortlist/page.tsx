import React from "react";
import { setRequestLocale } from "next-intl/server";
import { getShortlistAnalyticsAction } from "@/app/actions/admin-analytics-actions";
import { AdminShortlistAnalyticsDashboard } from "@/components/admin/admin-shortlist-analytics-dashboard";
import { BarChart3 } from "lucide-react";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function AdminShortlistAnalyticsPage({ params, searchParams }: PageProps) {
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
  const search = resolvedSearchParams.search || "";
  const pageNum = Number(resolvedSearchParams.page || "1");
  const sortBy = (resolvedSearchParams.sortBy as any) || "saves30";
  const sortOrder = (resolvedSearchParams.sortOrder as any) || "desc";

  const { analytics, total, limit } = await getShortlistAnalyticsAction({
    search,
    sortBy,
    sortOrder,
    page: pageNum,
    limit: 20,
  });

  const totalPages = Math.ceil(total / limit) || 1;

  // Fallback labels for headers
  const title = locale === "es" ? "Analítica de Favoritos" : "Shortlist Analytics";
  const subtitle = locale === "es" 
    ? "Monitorea la popularidad de propiedades y tendencias de favoritos" 
    : "Track property popularity and shortlist trends over time";

  return (
    <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-red-500" />
            <span>{title}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
        </div>
      </div>

      <AdminShortlistAnalyticsDashboard
        locale={locale}
        analytics={analytics}
        totalCount={total}
        currentPage={pageNum}
        totalPages={totalPages}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  );
}
