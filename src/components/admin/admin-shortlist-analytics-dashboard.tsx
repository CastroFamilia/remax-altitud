"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Heart,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";

export interface AnalyticsRow {
  id: string;
  apiId: string;
  titleEn: string;
  titleEs: string;
  totalSaves: number;
  saves30Days: number;
  activeSaves: number;
  totalViews: number;
  views30Days: number;
  slug?: string;
  priceUsd?: number;
  images?: Array<{ src: string }>;
}

interface AdminShortlistAnalyticsDashboardProps {
  locale: string;
  analytics: AnalyticsRow[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  sortBy: string;
  sortOrder: string;
}

export function AdminShortlistAnalyticsDashboard({
  locale,
  analytics,
  totalCount,
  currentPage,
  totalPages,
}: AdminShortlistAnalyticsDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchVal, setSearchVal] = useState(searchParams.get("search") || "");
  const [isPending, startTransition] = useTransition();

  // Stats calculation
  const totalSavesSum = analytics.reduce((acc, curr) => acc + (curr.totalSaves || 0), 0);
  const saves30DaysSum = analytics.reduce((acc, curr) => acc + (curr.saves30Days || 0), 0);
  const activeSavesSum = analytics.reduce((acc, curr) => acc + (curr.activeSaves || 0), 0);
  const totalViewsSum = analytics.reduce((acc, curr) => acc + (curr.totalViews || 0), 0);
  const views30DaysSum = analytics.reduce((acc, curr) => acc + (curr.views30Days || 0), 0);
  const topProperty =
    analytics.length > 0 ? [...analytics].sort((a, b) => b.totalSaves - a.totalSaves)[0] : null;

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
      router.push(`/${locale}/admin/analytics/shortlist?${params.toString()}`);
    });
  };

  const handleSortChange = (newSortBy: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSortBy = params.get("sortBy") || "saves30";
    const currentSortOrder = params.get("sortOrder") || "desc";

    if (currentSortBy === newSortBy) {
      params.set("sortOrder", currentSortOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sortBy", newSortBy);
      params.set("sortOrder", "desc");
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`/${locale}/admin/analytics/shortlist?${params.toString()}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/${locale}/admin/analytics/shortlist?${params.toString()}`);
  };

  // Translations Map
  const labels = {
    en: {
      title: "Shortlist Analytics",
      subtitle: "Track property popularity and shortlist trends over time",
      searchPlaceholder: "Search properties by title or code...",
      searchBtn: "Search",
      noProperties: "No properties found with shortlisting events.",
      colProperty: "Property",
      colCode: "Ref Code",
      colSaves30: "Saves (30 Days)",
      colTotalSaves: "Saves (All Time)",
      colActiveSaves: "Active Saves",
      colViews30: "Views (30 Days)",
      colTotalViews: "Views (All Time)",
      colActions: "Actions",
      statTotalSaves: "Total Shortlist Saves",
      statSaves30: "Saves (Last 30 Days)",
      statActiveSaves: "Active Shortlists",
      statTotalViews: "Total Property Views",
      statViews30: "Views (Last 30 Days)",
      statTopProperty: "Most Saved Property",
      statTopPropertyDesc: "Highest total popularity score",
      viewFront: "View Property",
      paginationInfo: "Showing {start} to {end} of {total} properties",
      of: "of",
    },
    es: {
      title: "Analítica de Favoritos",
      subtitle: "Monitorea la popularidad de propiedades y tendencias de favoritos",
      searchPlaceholder: "Buscar propiedades por título o código...",
      searchBtn: "Buscar",
      noProperties: "No se encontraron propiedades con favoritos.",
      colProperty: "Propiedad",
      colCode: "Código Ref",
      colSaves30: "Favoritos (Últimos 30d)",
      colTotalSaves: "Total de Favoritos",
      colActiveSaves: "Favoritos Activos",
      colViews30: "Visitas (Últimos 30d)",
      colTotalViews: "Total de Visitas",
      colActions: "Acciones",
      statTotalSaves: "Total de Favoritos",
      statSaves30: "Favoritos (Últimos 30 Días)",
      statActiveSaves: "Favoritos Activos",
      statTotalViews: "Total de Visitas",
      statViews30: "Visitas (Últimos 30 Días)",
      statTopProperty: "Propiedad Más Guardada",
      statTopPropertyDesc: "Mayor puntuación de popularidad",
      viewFront: "Ver Propiedad",
      paginationInfo: "Mostrando {start} al {end} de {total} propiedades",
      of: "de",
    },
  }[locale as "en" | "es"] || {
    title: "Shortlist Analytics",
    subtitle: "Track property popularity and shortlist trends over time",
    searchPlaceholder: "Search properties by title or code...",
    searchBtn: "Search",
    noProperties: "No properties found with shortlisting events.",
    colProperty: "Property",
    colCode: "Ref Code",
    colSaves30: "Saves (30 Days)",
    colTotalSaves: "Saves (All Time)",
    colActiveSaves: "Active Saves",
    colViews30: "Views (30 Days)",
    colTotalViews: "Views (All Time)",
    colActions: "Actions",
    statTotalSaves: "Total Shortlist Saves",
    statSaves30: "Saves (Last 30 Days)",
    statActiveSaves: "Active Shortlists",
    statTotalViews: "Total Property Views",
    statViews30: "Views (Last 30 Days)",
    statTopProperty: "Most Saved Property",
    statTopPropertyDesc: "Highest total popularity score",
    viewFront: "View Property",
    paginationInfo: "Showing {start} to {end} of {total} properties",
    of: "of",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Premium Statistics Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Saves Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md group hover:border-red-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-xl group-hover:bg-red-600/10 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {labels.statTotalSaves}
            </span>
            <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
              <Heart className="w-5 h-5 fill-current" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{totalSavesSum}</span>
          </div>
        </div>

        {/* 30 Days Saves Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md group hover:border-red-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-xl group-hover:bg-red-600/10 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {labels.statSaves30}
            </span>
            <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{saves30DaysSum}</span>
            {saves30DaysSum > 0 && (
              <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                +{Math.round((saves30DaysSum / (totalSavesSum || 1)) * 100)}% active
              </span>
            )}
          </div>
        </div>

        {/* Active Saves Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md group hover:border-red-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-xl group-hover:bg-red-600/10 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {labels.statActiveSaves}
            </span>
            <div className="p-2 bg-red-500/10 text-red-400 rounded-xl">
              <Heart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{activeSavesSum}</span>
          </div>
        </div>

        {/* Total Views Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md group hover:border-blue-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full blur-xl group-hover:bg-blue-600/10 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {labels.statTotalViews}
            </span>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
              <BarChart3 className="w-5 h-5 fill-current" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{totalViewsSum}</span>
          </div>
        </div>

        {/* 30 Days Views Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md group hover:border-blue-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full blur-xl group-hover:bg-blue-600/10 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {labels.statViews30}
            </span>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{views30DaysSum}</span>
          </div>
        </div>

        {/* Top Property Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md group hover:border-red-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl group-hover:bg-red-500/10 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {labels.statTopProperty}
            </span>
            <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            {topProperty ? (
              <>
                <p className="text-sm font-bold text-white truncate">
                  {locale === "es" ? topProperty.titleEs : topProperty.titleEn}
                </p>
                <p className="text-[10px] text-red-400 font-extrabold mt-1 font-mono">
                  #{topProperty.apiId} ({topProperty.totalSaves} saves)
                </p>
              </>
            ) : (
              <p className="text-xs font-medium text-slate-500 mt-2">N/A</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6 shadow-2xl">
        {/* Search and Filter Area */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch">
          {/* Search Input Form */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder={labels.searchPlaceholder}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all font-semibold"
              />
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all focus:ring-2 focus:ring-red-500 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{labels.searchBtn}</span>
            </button>
          </form>
        </div>

        {/* Premium Table Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 text-xs font-bold uppercase tracking-wider select-none">
                  <th className="px-6 py-4">{labels.colProperty}</th>
                  <th className="px-6 py-4">
                    <button
                      type="button"
                      data-testid="sort-code"
                      className="flex items-center gap-1.5 hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer font-bold text-xs uppercase tracking-wider text-slate-400 focus:outline-none"
                      onClick={() => handleSortChange("code")}
                    >
                      <span>{labels.colCode}</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </th>
                  <th className="px-6 py-4">
                    <button
                      type="button"
                      data-testid="sort-saves30"
                      className="flex items-center gap-1.5 hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer font-bold text-xs uppercase tracking-wider text-slate-400 focus:outline-none"
                      onClick={() => handleSortChange("saves30")}
                    >
                      <span>{labels.colSaves30}</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </th>
                  <th className="px-6 py-4">
                    <button
                      type="button"
                      data-testid="sort-savesAll"
                      className="flex items-center gap-1.5 hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer font-bold text-xs uppercase tracking-wider text-slate-400 focus:outline-none"
                      onClick={() => handleSortChange("savesAll")}
                    >
                      <span>{labels.colTotalSaves}</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </th>
                  <th className="px-6 py-4">
                    <button
                      type="button"
                      data-testid="sort-savesAll"
                      className="flex items-center gap-1.5 hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer font-bold text-xs uppercase tracking-wider text-slate-400 focus:outline-none"
                      onClick={() => handleSortChange("savesAll")}
                    >
                      <span>{labels.colTotalSaves}</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-400">
                      <span>{labels.colViews30}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-400">
                      <span>{labels.colTotalViews}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right">{labels.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                {analytics.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-bold">
                      {labels.noProperties}
                    </td>
                  </tr>
                ) : (
                  analytics.map((row) => {
                    const title = locale === "es" ? row.titleEs : row.titleEn;
                    const imageSrc =
                      (Array.isArray(row.images) ? row.images[0]?.src : null) ??
                      "/property-placeholder.svg";

                    return (
                      <tr
                        key={row.id}
                        data-testid={row.totalSaves === 0 ? "property-saves-zero" : "property-row"}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <Image
                              src={imageSrc}
                              alt={title}
                              width={48}
                              height={32}
                              unoptimized
                              className="w-12 h-8 object-cover rounded border border-slate-700 bg-slate-800"
                            />
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-100">{title}</span>
                              {row.slug && (
                                <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                  /{row.slug}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-400">
                          #{row.apiId}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">{row.saves30Days}</span>
                            {row.saves30Days > 0 && (
                              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full"
                                  style={{
                                    width: `${Math.min((row.saves30Days / 10) * 100, 100)}%`,
                                  }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-200">
                          {row.totalSaves === 0 ? "0 saves" : row.totalSaves}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-200">
                          {row.views30Days === 0 ? "-" : row.views30Days}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-200">
                          {row.totalViews === 0 ? "-" : row.totalViews}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {row.slug && (
                            <a
                              href={`/${locale}/properties/${row.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>{labels.viewFront}</span>
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Section */}
        {analytics.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <span className="text-xs text-slate-500 font-semibold">
              {labels.paginationInfo
                .replace("{start}", String((currentPage - 1) * 20 + 1))
                .replace("{end}", String(Math.min(currentPage * 20, totalCount)))
                .replace("{total}", String(totalCount))}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer animate-hover"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="text-sm font-semibold text-slate-400 px-2 select-none">
                {currentPage} {labels.of} {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer animate-hover"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
