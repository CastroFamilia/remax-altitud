"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, Loader2, Tags, ChevronLeft, ChevronRight, X } from "lucide-react";
import { LIFESTYLE_TAGS, tagDisplayLabel } from "@/lib/constants/lifestyle-tags";
import { updatePropertyTagsAction } from "@/app/actions/admin-tag-actions";
import { formatUSD } from "@/lib/utils/currency";

export interface AdminProperty {
  id: string;
  apiId: string;
  slug: string;
  propertyType: string;
  status: string;
  priceUsd: number;
  lifestyleTags: string[];
  titleEn: string;
  titleEs: string;
  images: { src: string }[] | null | undefined;
  isVisible: boolean;
}

interface AdminTagsTableProps {
  locale: string;
  properties: AdminProperty[];
  total: number;
  currentPage: number;
  hasMore: boolean;
}

export function AdminTagsTable({
  locale,
  properties,
  total,
  currentPage,
  hasMore,
}: AdminTagsTableProps) {
  const t = useTranslations("AdminTags");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search input state
  const [searchVal, setSearchVal] = useState(searchParams.get("search") || "");
  const [isPending, startTransition] = useTransition();

  // Modal state
  const [selectedProperty, setSelectedProperty] = useState<AdminProperty | null>(null);
  const [modalTags, setModalTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
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
      router.push(`/${locale}/admin/tags?${params.toString()}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/${locale}/admin/tags?${params.toString()}`);
  };

  const handleOpenModal = (property: AdminProperty) => {
    setSelectedProperty(property);
    setModalTags([...property.lifestyleTags]);
    setAlert(null);
  };

  const handleCloseModal = () => {
    setSelectedProperty(null);
    setModalTags([]);
    setAlert(null);
  };

  const handleTagToggle = (tag: string) => {
    setModalTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveChanges = async () => {
    if (!selectedProperty) return;
    setIsSaving(true);
    setAlert(null);
    try {
      const res = await updatePropertyTagsAction(selectedProperty.id, modalTags);
      if (res.success) {
        setAlert({
          type: "success",
          message: t("successMessage", { title: locale === "es" ? selectedProperty.titleEs : selectedProperty.titleEn }),
        });
        // Update local property tags list visually
        selectedProperty.lifestyleTags = [...modalTags];
        router.refresh();
        setTimeout(() => {
          handleCloseModal();
        }, 1500);
      } else {
        setAlert({ type: "error", message: t("errorMessage") });
      }
    } catch (error) {
      console.error(error);
      setAlert({ type: "error", message: t("errorMessage") });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Input Form */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
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
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-all focus:ring-2 focus:ring-red-500 disabled:opacity-50 cursor-pointer flex items-center gap-2"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Search</span>
        </button>
      </form>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table data-testid="listings-tags-table" className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4 w-20">{t("tableThumbnail")}</th>
                <th className="px-6 py-4">{t("tableTitle")}</th>
                <th className="px-6 py-4 w-32">{t("tableRef")}</th>
                <th className="px-6 py-4 w-32">{t("tablePrice")}</th>
                <th className="px-6 py-4">{t("tableTags")}</th>
                <th className="px-6 py-4 text-right w-40">{t("tableActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-semibold">
                    {t("noProperties")}
                  </td>
                </tr>
              ) : (
                properties.map((property) => {
                  const title = locale === "es" ? property.titleEs : property.titleEn;
                  const imageSrc =
                    (Array.isArray(property.images) ? property.images[0]?.src : null) ??
                    "/property-placeholder.svg";

                  return (
                    <tr
                      key={property.id}
                      data-testid="listing-tags-row"
                      className="hover:bg-slate-800/40 transition-colors property-row"
                    >
                      <td className="px-6 py-4">
                        <img
                          src={imageSrc}
                          alt={title}
                          className="w-12 h-8 object-cover rounded border border-slate-700 bg-slate-800"
                        />
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-100 property-title">
                        {title}
                      </td>
                      <td data-testid="listing-ref-code" className="px-6 py-4 font-mono font-bold text-slate-400 property-ref">
                        #{property.apiId}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-200 property-price">
                        {formatUSD(property.priceUsd, locale)}
                      </td>
                      <td data-testid="listing-tags-chips" className="px-6 py-4 property-tags">
                        <div className="flex flex-wrap gap-1.5">
                          {property.lifestyleTags.length === 0 ? (
                            <span className="text-xs text-slate-500 italic">-</span>
                          ) : (
                            property.lifestyleTags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 lifestyle-tag-chip"
                              >
                                {tagDisplayLabel(tag)}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenModal(property)}
                          data-testid="manage-tags-btn"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer manage-tags-btn"
                        >
                          <Tags className="w-3.5 h-3.5" />
                          <span>{t("btnManageTags")}</span>
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pb-12">
          <span className="text-xs text-slate-500 font-semibold">
            {t("paginationInfo", {
              start: (currentPage - 1) * 10 + 1,
              end: Math.min(currentPage * 10, total),
              total,
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
              {currentPage}
            </span>

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

      {/* Modal */}
      {selectedProperty && (
        <div data-testid="manage-tags-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm tags-modal">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
            {/* Close button */}
            <button
              onClick={handleCloseModal}
              className="absolute right-4 top-4 p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div>
              <h2 className="text-xl font-bold text-white pr-8">
                {t("modalTitle", { title: locale === "es" ? selectedProperty.titleEs : selectedProperty.titleEn })}
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-semibold">
                {t("modalDescription")}
              </p>
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

            {/* Tags Checklist */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {LIFESTYLE_TAGS.map((tag) => {
                const isChecked = modalTags.includes(tag);
                const tagSlug = tag.toLowerCase().replace(/\s+/g, "-");
                return (
                  <label
                    key={tag}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-950/50 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700/80 cursor-pointer transition-all select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTagToggle(tag)}
                      className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-slate-900 border-slate-700 cursor-pointer tag-checkbox"
                      data-tag={tag}
                      value={tagSlug}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-200">
                        {tagDisplayLabel(tag)}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSaving}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-all rounded-lg hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                {t("btnCancel")}
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={isSaving}
                data-testid="save-tags-btn"
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-all focus:ring-2 focus:ring-red-500 disabled:opacity-50 cursor-pointer flex items-center gap-2 save-tags-btn"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSaving ? t("saving") : t("btnSave")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
