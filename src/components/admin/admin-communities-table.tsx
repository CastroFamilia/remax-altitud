"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Search,
  Loader2,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { deleteCommunityAction } from "@/app/actions/admin-community-actions";

export interface AdminCommunity {
  id: string;
  slug: string;
  name: string;
  taglineEn: string;
  taglineEs: string;
  heroImageUrl: string | null;
  listingCount: number;
  areaId: string;
  areaNameEn: string;
  areaNameEs: string;
}

interface AdminCommunitiesTableProps {
  locale: string;
  communities: AdminCommunity[];
  total: number;
  currentPage: number;
  hasMore: boolean;
}

export function AdminCommunitiesTable({
  locale,
  communities,
  total,
  currentPage,
  hasMore,
}: AdminCommunitiesTableProps) {
  const t = useTranslations("AdminCommunities");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search input state
  const [searchVal, setSearchVal] = useState(searchParams.get("search") || "");
  const [isPending, startTransition] = useTransition();

  // Delete modal state
  const [communityToDelete, setCommunityToDelete] = useState<AdminCommunity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
      router.push(`/${locale}/admin/communities?${params.toString()}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/${locale}/admin/communities?${params.toString()}`);
  };

  const handleDeleteOpen = (community: AdminCommunity) => {
    setCommunityToDelete(community);
    setAlert(null);
  };

  const handleDeleteClose = () => {
    setCommunityToDelete(null);
    setAlert(null);
  };

  const handleDeleteConfirm = async () => {
    if (!communityToDelete) return;
    setIsDeleting(true);
    setAlert(null);
    try {
      const res = await deleteCommunityAction(communityToDelete.id);
      if (res.success) {
        setAlert({
          type: "success",
          message: t("successDeleted"),
        });
        router.refresh();
        setTimeout(() => {
          handleDeleteClose();
        }, 1500);
      } else {
        setAlert({ type: "error", message: t("errorSaveFailed") });
      }
    } catch (error) {
      console.error(error);
      setAlert({ type: "error", message: t("errorSaveFailed") });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Input and Create CTA */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder={t("searchPlaceholder")}
              data-testid="search-communities-input"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all font-semibold"
            />
            <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-500" />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 font-semibold rounded-lg text-sm transition-all focus:ring-2 focus:ring-red-500 disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Search</span>
          </button>
        </form>

        <button
          onClick={() => router.push(`/${locale}/admin/communities/new`)}
          data-testid="create-community-btn"
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-all focus:ring-2 focus:ring-red-500 cursor-pointer flex items-center gap-2 justify-center shadow-lg hover:shadow-red-900/20"
        >
          <Plus className="w-4 h-4" />
          <span>{t("btnCreateCommunity")}</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table data-testid="communities-table" className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4 w-24">Image</th>
                <th className="px-6 py-4">{t("tableHeadName")}</th>
                <th className="px-6 py-4">{t("tableHeadArea")}</th>
                <th className="px-6 py-4 w-40 text-center">{t("tableHeadListings")}</th>
                <th className="px-6 py-4 text-right w-48">{t("tableHeadActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
              {communities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-semibold">
                    No communities found.
                  </td>
                </tr>
              ) : (
                communities.map((community) => {
                  const areaName = locale === "es" ? community.areaNameEs : community.areaNameEn;
                  const imageSrc = community.heroImageUrl || "/property-placeholder.svg";

                  return (
                    <tr
                      key={community.id}
                      data-testid="community-row"
                      className="hover:bg-slate-800/40 transition-colors community-row"
                    >
                      <td className="px-6 py-4">
                        <Image
                          src={imageSrc}
                          alt={community.name}
                          width={64}
                          height={40}
                          unoptimized
                          className="w-16 h-10 object-cover rounded border border-slate-700 bg-slate-800"
                        />
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-100">
                        <div className="flex flex-col">
                          <span className="font-bold text-base text-slate-100">
                            {community.name}
                          </span>
                          <span className="text-xs text-slate-400 italic">
                            {locale === "es" ? community.taglineEs : community.taglineEn}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
                          {areaName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-slate-200">
                        {community.listingCount}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              router.push(`/${locale}/admin/communities/${community.id}`)
                            }
                            data-testid="edit-community-btn"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 rounded-lg transition-all cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5 text-blue-400" />
                            <span>{t("btnEdit")}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteOpen(community)}
                            data-testid="delete-community-btn"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 hover:bg-red-950 border border-red-900/30 text-red-400 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{t("btnDelete")}</span>
                          </button>
                        </div>
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
      {communities.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pb-12">
          <span className="text-xs text-slate-500 font-semibold">
            Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, total)} of {total}{" "}
            communities
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-sm font-semibold text-slate-400">{currentPage}</span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasMore}
              className="flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {communityToDelete && (
        <div
          data-testid="delete-community-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
            {/* Modal Header */}
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Delete Community</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  {t("confirmDelete", { name: communityToDelete.name })}
                </p>
              </div>
            </div>

            {/* Alert Message */}
            {alert && (
              <div
                className={`p-3.5 rounded-lg border text-sm font-medium ${
                  alert.type === "success"
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                {alert.message}
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleDeleteClose}
                disabled={isDeleting}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-all rounded-lg hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                {t("btnCancel")}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                data-testid="confirm-delete-btn"
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-all focus:ring-2 focus:ring-red-500 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isDeleting ? "Deleting..." : t("btnDelete")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
