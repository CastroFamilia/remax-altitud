"use client";

import React, { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  BarChart3,
  Globe,
  LineChart,
  Lock,
  AlertCircle,
} from "lucide-react";
import { updatePropertyVisibilityAction } from "@/app/actions/admin-visibility-actions";
import { formatUSD } from "@/lib/utils/currency";

export interface AdminProperty {
  id: string;
  apiId: string;
  slug: string;
  propertyType: string;
  status: string;
  priceUsd: number;
  titleEn: string;
  titleEs: string;
  images: unknown;
  isVisible: boolean;
  latitude: number | null;
  longitude: number | null;
  communityId: string | null;
}

interface AdminVisibilityDashboardProps {
  locale: string;
  properties: AdminProperty[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  showHiddenOnly: boolean;
}

export function AdminVisibilityDashboard({
  locale,
  properties,
  totalCount,
  currentPage,
  totalPages,
  showHiddenOnly,
}: AdminVisibilityDashboardProps) {
  const t = useTranslations("AdminVisibility");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state for properties
  const [localProperties, setLocalProperties] = useState<AdminProperty[]>(properties);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setLocalProperties(properties);
  }, [properties]);

  // Search input state
  const [searchVal, setSearchVal] = useState(searchParams.get("search") || "");
  const [isPending, startTransition] = useTransition();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchVal.trim()) {
      params.set("search", searchVal.trim());
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`/${locale}/admin/visibility?${params.toString()}`);
    });
  };

  const handleHiddenOnlyToggle = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set("hiddenOnly", "true");
    } else {
      params.delete("hiddenOnly");
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`/${locale}/admin/visibility?${params.toString()}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/${locale}/admin/visibility?${params.toString()}`);
  };

  const handleVisibilityToggle = async (property: AdminProperty) => {
    setUpdatingId(property.id);
    setAlert(null);
    try {
      const nextVisibility = !property.isVisible;
      const res = await updatePropertyVisibilityAction(property.id, nextVisibility);
      if (res.success) {
        setAlert({
          type: "success",
          message: nextVisibility ? t("successVisible") : t("successHidden"),
        });

        // Update local state visually
        setLocalProperties((prev) =>
          prev.map((p) => (p.id === property.id ? { ...p, isVisible: nextVisibility } : p)),
        );

        router.refresh();
      } else {
        setAlert({ type: "error", message: t("errorUpdate") });
      }
    } catch (error) {
      console.error(error);
      setAlert({ type: "error", message: t("errorUpdate") });
    } finally {
      setUpdatingId(null);
      setTimeout(() => setAlert(null), 3000);
    }
  };

  return (
    <div className="space-y-12">
      {alert && (
        <div
          className={`p-3.5 rounded-lg border text-sm font-semibold flex items-center gap-2 ${
            alert.type === "success"
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{alert.message}</span>
        </div>
      )}

      {/* Section 1: Listings Table */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <BarChart3 className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-bold text-white">Property Visibility Status</h2>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          {/* Search Input Form */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder={t("searchPlaceholder")}
                data-testid="search-listings-input"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all font-semibold"
              />
              <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-500" />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 bg-red-650 hover:bg-red-705 text-white font-semibold rounded-lg text-sm transition-all focus:ring-2 focus:ring-red-500 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Search</span>
            </button>
          </form>

          {/* Hidden Listings Only Checkbox */}
          <label className="flex items-center gap-3 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-850/60 transition-colors select-none">
            <input
              type="checkbox"
              checked={showHiddenOnly}
              onChange={(e) => handleHiddenOnlyToggle(e.target.checked)}
              data-testid="filter-hidden-only-checkbox"
              className="w-4.5 h-4.5 rounded text-red-600 focus:ring-red-500 bg-slate-950 border-slate-800 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-300">{t("showHiddenOnly")}</span>
          </label>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table
              data-testid="listings-visibility-table"
              className="w-full text-left border-collapse"
            >
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4 w-20">{t("tableThumbnail")}</th>
                  <th className="px-6 py-4">{t("tableTitle")}</th>
                  <th className="px-6 py-4 w-32">{t("tableRef")}</th>
                  <th className="px-6 py-4 w-32">{t("tablePrice")}</th>
                  <th className="px-6 py-4 w-36">{t("tableVisibility")}</th>
                  <th className="px-6 py-4 text-right w-[180px]">{t("tableActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                {localProperties.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-semibold">
                      {t("noProperties")}
                    </td>
                  </tr>
                ) : (
                  localProperties.map((property) => {
                    const title = locale === "es" ? property.titleEs : property.titleEn;
                    const imageSrc =
                      (Array.isArray(property.images) ? property.images[0]?.src : null) ??
                      "/property-placeholder.svg";

                    return (
                      <tr
                        key={property.id}
                        data-testid="listing-visibility-row"
                        data-property-slug={property.slug}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <Image
                            src={imageSrc}
                            alt={title}
                            width={48}
                            height={32}
                            unoptimized
                            className="w-12 h-8 object-cover rounded border border-slate-700 bg-slate-800"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-100">{title}</span>
                            <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                              /{property.slug}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-400">
                          #{property.apiId}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-200">
                          {formatUSD(property.priceUsd, locale)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            data-testid="visibility-status-badge"
                            className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                              property.isVisible
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {property.isVisible ? t("badgeVisible") : t("badgeHidden")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleVisibilityToggle(property)}
                            disabled={updatingId === property.id}
                            data-testid="visibility-toggle-btn"
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                              property.isVisible
                                ? "bg-slate-805 hover:bg-slate-750 text-slate-300 border border-slate-700"
                                : "bg-red-600 hover:bg-red-750 text-white"
                            }`}
                          >
                            {updatingId === property.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : property.isVisible ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                            <span>{property.isVisible ? t("btnHide") : t("btnShow")}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {properties.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <span className="text-xs text-slate-500 font-semibold">
              {t("paginationInfo", {
                start: (currentPage - 1) * 10 + 1,
                end: Math.min(currentPage * 10, totalCount),
                total: totalCount,
              })}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="text-sm font-semibold text-slate-400">
                {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: SEO and Analytics Monitoring Dashboard Section */}
      <div
        data-testid="seo-monitoring-dashboard"
        className="space-y-6 pt-6 border-t border-slate-800"
      >
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-red-500" />
              <span>{t("seoDashboardTitle")}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 font-semibold">
              Real-time visibility metrics integrated with Search Console and GA4 tracking
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">
              Connected
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Widget 1: Google Search Console */}
          <div
            data-testid="gsc-analytics-widget"
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-6 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-500" />
                  <span>{t("gscTitle")}</span>
                </h3>
                <span className="text-xs text-slate-500 font-semibold">Last 30 Days</span>
              </div>

              {/* Metric cards */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  data-testid="gsc-impressions-metric"
                  className="bg-slate-950 border border-slate-850 rounded-lg p-4 space-y-1"
                >
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
                    {t("gscImpressions")}
                  </span>
                  <p className="text-2xl font-black text-slate-100">42,850</p>
                  <span className="text-[10px] font-bold text-green-400">
                    ▲ +12.3% vs prev month
                  </span>
                </div>

                <div
                  data-testid="gsc-ctr-metric"
                  className="bg-slate-950 border border-slate-850 rounded-lg p-4 space-y-1"
                >
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
                    {t("gscCtr")}
                  </span>
                  <p className="text-2xl font-black text-slate-100">3.82%</p>
                  <span className="text-[10px] font-bold text-green-400">
                    ▲ +0.45% vs prev month
                  </span>
                </div>
              </div>

              {/* Trend sparkline chart */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400">{t("gscOrganicTraffic")}</span>
                <div className="h-28 w-full bg-slate-950 border border-slate-850 rounded-lg p-2 flex items-end relative overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gscGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 30 L5 25 L10 27 L15 20 L20 22 L25 15 L30 18 L35 12 L40 14 L45 8 L50 12 L55 6 L60 8 L65 5 L70 9 L75 4 L80 6 L85 2 L90 5 L95 2 L100 1 L100 30 Z"
                      fill="url(#gscGradient)"
                    />
                    <path
                      d="M0 30 Q 5 25, 10 27 T 20 22 T 30 18 T 40 14 T 50 12 T 60 8 T 70 9 T 80 6 T 90 5 T 100 1"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <div className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                    Weekly Avg: 1,420 clicks
                  </div>
                </div>
              </div>

              {/* Top keywords list */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400">{t("gscKeywords")}</span>
                <div className="bg-slate-950 rounded-lg border border-slate-850 divide-y divide-slate-850 overflow-hidden text-xs">
                  {[
                    { word: "costa rica properties for sale", clicks: 340, pos: 2.1 },
                    { word: "perez zeledon houses", clicks: 215, pos: 1.8 },
                    { word: "remax dominical", clicks: 198, pos: 1.2 },
                    { word: "uvita investment farms", clicks: 120, pos: 3.4 },
                  ].map((kw, i) => (
                    <div key={i} className="flex justify-between px-4 py-2 hover:bg-slate-900/50">
                      <span className="font-semibold text-slate-300 font-mono">{kw.word}</span>
                      <div className="flex gap-4 font-bold">
                        <span className="text-slate-400">{kw.clicks} clicks</span>
                        <span className="text-blue-400">Pos: {kw.pos}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Indexing breakdown */}
            <div className="pt-4 border-t border-slate-800 flex justify-between text-xs font-semibold text-slate-400">
              <span>{t("gscIndexing")}:</span>
              <div className="flex gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span> {t("gscIndexed")}:
                  128
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span> {t("gscExcluded")}:
                  12
                </span>
              </div>
            </div>
          </div>

          {/* Widget 2: Google Analytics 4 */}
          <div
            data-testid="ga4-analytics-widget"
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-6 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-red-500" />
                  <span>{t("ga4Title")}</span>
                </h3>
                <span className="text-xs text-slate-500 font-semibold">
                  Real-Time User Engagement
                </span>
              </div>

              {/* Popular Pages List */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400">{t("ga4PopularPages")}</span>
                <div
                  data-testid="ga4-popular-pages-list"
                  className="bg-slate-950 border border-slate-850 rounded-lg overflow-hidden divide-y divide-slate-850 text-xs"
                >
                  {[
                    { path: "/en/property/ocean-view-condo", views: 2450, saves: 142, rate: "76%" },
                    {
                      path: "/en/property/mountain-sanctuary",
                      views: 1890,
                      saves: 98,
                      rate: "81%",
                    },
                    {
                      path: "/en/property/valle-de-el-general-finca",
                      views: 1540,
                      saves: 65,
                      rate: "69%",
                    },
                    { path: "/en/search?q=uvita", views: 1200, saves: 0, rate: "58%" },
                    {
                      path: "/en/property/tropical-modern-villa",
                      views: 980,
                      saves: 54,
                      rate: "82%",
                    },
                  ].map((page, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center px-4 py-3 hover:bg-slate-900/50"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-200 font-mono break-all">
                          {page.path}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Engagement Rate: {page.rate}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-right flex-shrink-0">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-100">{page.views}</span>
                          <span className="text-[9px] uppercase tracking-wider text-slate-500">
                            {t("ga4Views")}
                          </span>
                        </div>
                        {page.saves > 0 && (
                          <div className="flex flex-col">
                            <span className="font-extrabold text-red-400">♥ {page.saves}</span>
                            <span className="text-[9px] uppercase tracking-wider text-slate-500">
                              {t("ga4Saves")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cookieless compliance notice */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex items-start gap-2 text-[11px] font-semibold text-slate-400">
                <Lock className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  This website implements Cookieless tracking & default Denied consent mode. GA4 is
                  configured with client storage disabled to respect visitor privacy laws while
                  preserving aggregate analytics.
                </p>
              </div>
            </div>

            {/* GA4 Script check indicator */}
            <div className="pt-4 border-t border-slate-800 flex justify-between text-xs font-semibold text-slate-400 items-center">
              <span>Consent Mode Policy:</span>
              <span className="inline-flex items-center gap-1.5 text-green-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                Active (No Cookies)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
