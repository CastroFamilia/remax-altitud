import React from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { fetchAdminCommunitiesData } from "@/app/actions/admin-community-actions";
import { AdminCommunitiesTable, AdminCommunity } from "@/components/admin/admin-communities-table";
import { Map } from "lucide-react";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}

export default async function AdminCommunitiesPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "AdminCommunities" });

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

  const { communities, total, hasMore } = await fetchAdminCommunitiesData({
    search,
    page: pageNum,
  });

  return (
    <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Map className="w-7 h-7 text-red-500" />
            <span>{t("title")}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">{t("subtitle")}</p>
        </div>
      </div>

      {/* Table & Interactions */}
      <AdminCommunitiesTable
        locale={locale}
        communities={communities as unknown as AdminCommunity[]}
        total={total}
        currentPage={pageNum}
        hasMore={hasMore}
      />
    </div>
  );
}
