"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";

import { Search, Loader2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { fetchAdminPropertiesData } from "@/app/actions/admin-tag-actions";
import { updatePropertyCommunityAction } from "@/app/actions/admin-community-actions";
import { formatUSD } from "@/lib/utils/currency";
import type { AdminProperty } from "@/components/admin/admin-tags-table";

interface AdminCommunityListingsProps {
  communityId: string;
  locale: string;
}

export function AdminCommunityListings({ communityId, locale }: AdminCommunityListingsProps) {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [isPending, startTransition] = useTransition();

  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadProperties = (page: number, search: string) => {
    startTransition(async () => {
      try {
        const res = await fetchAdminPropertiesData({ page, search });
        setProperties(res.properties as AdminProperty[]);
        setTotal(res.total);
        setHasMore(res.hasMore);
        setCurrentPage(res.page);
      } catch (error) {
        console.error("Failed to load properties:", error);
      }
    });
  };

  useEffect(() => {
    loadProperties(1, "");
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProperties(1, searchVal);
  };

  const handlePageChange = (newPage: number) => {
    loadProperties(newPage, searchVal);
  };

  const togglePropertyCommunity = async (property: AdminProperty) => {
    const isCurrentlyAssigned = property.communityId === communityId;
    const newCommunityId = isCurrentlyAssigned ? null : communityId;

    setLoadingMap((prev) => ({ ...prev, [property.id]: true }));
    setAlert(null);

    try {
      const res = await updatePropertyCommunityAction(property.id, newCommunityId);
      if (res.success) {
        setAlert({
          type: "success",
          message: `Successfully ${isCurrentlyAssigned ? "removed" : "added"} ${property.apiId} ${isCurrentlyAssigned ? "from" : "to"} community.`,
        });
        setProperties((prev) =>
          prev.map((p) => (p.id === property.id ? { ...p, communityId: newCommunityId } : p)),
        );
      } else {
        setAlert({
          type: "error",
          message: res.error || "Failed to update property assignment.",
        });
      }
    } catch (error) {
      console.error(error);
      setAlert({
        type: "error",
        message: "Failed to update property assignment.",
      });
    } finally {
      setLoadingMap((prev) => ({ ...prev, [property.id]: false }));

      // Auto dismiss alert
      setTimeout(() => setAlert(null), 3000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6 mt-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Community Listings
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            Search and assign properties to this community.
          </p>
        </div>
      </div>

      {alert && (
        <div
          className={`p-4 rounded-lg border text-sm font-semibold ${
            alert.type === "success"
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}
        >
          {alert.message}
        </div>
      )}

      {/* Search Input Form */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search by API ID or Title..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-semibold"
          />
          <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-500" />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-sm transition-all focus:ring-2 focus:ring-red-500 disabled:opacity-50 cursor-pointer flex items-center gap-2"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Search</span>
        </button>
      </form>

      {/* Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden shadow-sm relative">
        {isPending && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4 w-20">Image</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4 w-32">Ref</th>
                <th className="px-6 py-4 w-32">Price</th>
                <th className="px-6 py-4 w-32 text-center">Status</th>
                <th className="px-6 py-4 text-right w-[160px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-semibold">
                    No properties found.
                  </td>
                </tr>
              ) : (
                properties.map((property) => {
                  const title = locale === "es" ? property.titleEs : property.titleEn;
                  const imageSrc =
                    (Array.isArray(property.images) ? property.images[0]?.src : null) ??
                    "/property-placeholder.svg";

                  const isAssigned = property.communityId === communityId;
                  const isLoading = loadingMap[property.id];

                  return (
                    <tr
                      key={property.id}
                      className={`${
                        isAssigned ? "bg-red-500/5" : "hover:bg-slate-800/40"
                      } transition-colors`}
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
                        <div className="font-bold text-slate-100 line-clamp-1">{title}</div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-400">
                        #{property.apiId}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-200">
                        {formatUSD(property.priceUsd, locale)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isAssigned ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-400 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                            <Check className="w-3 h-3" /> Assigned
                          </span>
                        ) : property.communityId ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                            Other Comm.
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => togglePropertyCommunity(property)}
                          disabled={isLoading}
                          className={`inline-flex items-center justify-center min-w-[100px] gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                            isAssigned
                              ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }`}
                        >
                          {isLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isAssigned ? (
                            "Remove"
                          ) : (
                            "Assign"
                          )}
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          <span className="text-xs text-slate-500 font-semibold">
            Showing {(currentPage - 1) * 10 + 1} - {Math.min(currentPage * 10, total)} of {total}{" "}
            listings
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isPending}
              className="flex items-center justify-center p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-slate-400 px-2">{currentPage}</span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasMore || isPending}
              className="flex items-center justify-center p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
