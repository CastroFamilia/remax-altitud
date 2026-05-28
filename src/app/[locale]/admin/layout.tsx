import React from "react";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { Activity, Users, Tags, Map, Eye, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Admin" });

  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  const adminPassword =
    process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? undefined : "admin");

  const expectedSession = adminPassword
    ? createHash("sha256").update(adminPassword).digest("hex")
    : undefined;
  const isAuthenticated = !!expectedSession && session === expectedSession;

  if (!isAuthenticated) {
    return <AdminLoginForm />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between p-6">
        <div>
          {/* Logo & Header */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {t("navigationTitle")}
              </h2>
              <p className="text-xs text-slate-500 font-medium">{t("controlCenter")}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <Link
              href={`/${locale}/admin`}
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-white bg-slate-800 font-semibold transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-red-500" />
                <span>{t("syncStatus")}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                {t("active")}
              </span>
            </Link>

            <Link
              href={`/${locale}/admin/leads`}
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-white hover:bg-slate-800 font-semibold transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-red-500" />
                <span>{t("leads")}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                {t("active")}
              </span>
            </Link>

            <Link
              href={`/${locale}/admin/tags`}
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-white hover:bg-slate-800 font-semibold transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Tags className="w-5 h-5 text-red-500" />
                <span>{t("lifestyleTags")}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                {t("active")}
              </span>
            </Link>

            <div className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-slate-500 cursor-not-allowed select-none font-semibold group">
              <div className="flex items-center gap-3">
                <Map className="w-5 h-5 text-slate-600" />
                <span>{t("communities")}</span>
              </div>
              <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-600">
                {t("stub")}
              </span>
            </div>

            <div className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-slate-500 cursor-not-allowed select-none font-semibold group">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-slate-600" />
                <span>{t("visibility")}</span>
              </div>
              <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-600">
                {t("stub")}
              </span>
            </div>
          </nav>
        </div>

        {/* Footer actions */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <AdminLogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 text-slate-100">{children}</main>
    </div>
  );
}
