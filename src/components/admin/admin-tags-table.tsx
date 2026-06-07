"use client";

import React, { useState, useTransition, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Search,
  Loader2,
  Tags,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  AlertCircle,
  HelpCircle,
  FileText,
} from "lucide-react";
import { LIFESTYLE_TAGS, tagDisplayLabel } from "@/lib/constants/lifestyle-tags";
import {
  updatePropertyTagsAction,
  updatePropertyZmtStatusAction,
} from "@/app/actions/admin-tag-actions";
import { updatePropertyCommunityAction } from "@/app/actions/admin-community-actions";
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
  latitude: number | null;
  longitude: number | null;
  communityId: string | null;
  zmtStatus: string;
}

export interface DatabaseCommunity {
  id: string;
  slug: string;
  name: string;
  geoFenceCoords: {
    type: "Polygon";
    coordinates: [number, number][][];
  } | null;
}

interface AdminTagsTableProps {
  locale: string;
  properties: AdminProperty[];
  communities: DatabaseCommunity[];
  total: number;
  currentPage: number;
  hasMore: boolean;
}

// Ray Casting Algorithm to check if a point lies inside a polygon
function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [lng, lat] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function AdminTagsTable({
  locale,
  properties,
  communities,
  total,
  currentPage,
  hasMore,
}: AdminTagsTableProps) {
  const t = useTranslations("AdminTags");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state for properties to prevent prop mutations
  const [localProperties, setLocalProperties] = useState<AdminProperty[]>(properties);

  useEffect(() => {
    setLocalProperties(properties);
  }, [properties]);

  // Search input state
  const [searchVal, setSearchVal] = useState(searchParams.get("search") || "");
  const [isPending, startTransition] = useTransition();

  // Tags Modal state
  const [selectedProperty, setSelectedProperty] = useState<AdminProperty | null>(null);
  const [modalTags, setModalTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Communities Modal state
  const [selectedPropertyForCommunity, setSelectedPropertyForCommunity] =
    useState<AdminProperty | null>(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");
  const [isSavingCommunity, setIsSavingCommunity] = useState(false);
  const [communityAlert, setCommunityAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Legal Status Modal state
  const [selectedPropertyForLegal, setSelectedPropertyForLegal] = useState<AdminProperty | null>(
    null,
  );
  const [selectedZmtStatus, setSelectedZmtStatus] = useState<string>("");
  const [isSavingLegal, setIsSavingLegal] = useState(false);
  const [legalAlert, setLegalAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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

  const handleOpenCommunityModal = (property: AdminProperty) => {
    setSelectedPropertyForCommunity(property);
    setSelectedCommunityId(property.communityId || "");
    setCommunityAlert(null);
  };

  const handleCloseCommunityModal = () => {
    setSelectedPropertyForCommunity(null);
    setSelectedCommunityId("");
    setCommunityAlert(null);
  };

  const handleOpenLegalModal = (property: AdminProperty) => {
    setSelectedPropertyForLegal(property);
    setSelectedZmtStatus(property.zmtStatus || "none");
    setLegalAlert(null);
  };

  const handleCloseLegalModal = () => {
    setSelectedPropertyForLegal(null);
    setSelectedZmtStatus("");
    setLegalAlert(null);
  };

  const handleTagToggle = (tag: string) => {
    setModalTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
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
          message: t("successMessage", {
            title: locale === "es" ? selectedProperty.titleEs : selectedProperty.titleEn,
          }),
        });
        // Update local property tags list visually
        setLocalProperties((prev) =>
          prev.map((p) =>
            p.id === selectedProperty.id ? { ...p, lifestyleTags: [...modalTags] } : p,
          ),
        );
        setSelectedProperty((prev) => (prev ? { ...prev, lifestyleTags: [...modalTags] } : null));
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

  const handleSaveCommunity = async () => {
    if (!selectedPropertyForCommunity) return;
    setIsSavingCommunity(true);
    setCommunityAlert(null);
    try {
      const val = selectedCommunityId === "" ? null : selectedCommunityId;
      const res = await updatePropertyCommunityAction(selectedPropertyForCommunity.id, val);
      if (res.success) {
        setCommunityAlert({
          type: "success",
          message: `Successfully updated community for property.`,
        });
        // Update local property community assignment visually
        setLocalProperties((prev) =>
          prev.map((p) =>
            p.id === selectedPropertyForCommunity.id ? { ...p, communityId: val } : p,
          ),
        );
        setSelectedPropertyForCommunity((prev) => (prev ? { ...prev, communityId: val } : null));
        router.refresh();
        setTimeout(() => {
          handleCloseCommunityModal();
        }, 1500);
      } else {
        setCommunityAlert({ type: "error", message: "Failed to update community association." });
      }
    } catch (error) {
      console.error(error);
      setCommunityAlert({ type: "error", message: "Failed to update community association." });
    } finally {
      setIsSavingCommunity(false);
    }
  };

  const handleSaveLegal = async () => {
    if (!selectedPropertyForLegal) return;
    setIsSavingLegal(true);
    setLegalAlert(null);
    try {
      const res = await updatePropertyZmtStatusAction(
        selectedPropertyForLegal.id,
        selectedZmtStatus,
      );
      if (res.success) {
        setLegalAlert({
          type: "success",
          message: `Successfully updated legal status for property.`,
        });
        // Update local property visually
        setLocalProperties((prev) =>
          prev.map((p) =>
            p.id === selectedPropertyForLegal.id ? { ...p, zmtStatus: selectedZmtStatus } : p,
          ),
        );
        setSelectedPropertyForLegal((prev) =>
          prev ? { ...prev, zmtStatus: selectedZmtStatus } : null,
        );
        router.refresh();
        setTimeout(() => {
          handleCloseLegalModal();
        }, 1500);
      } else {
        setLegalAlert({ type: "error", message: "Failed to update legal status." });
      }
    } catch (error) {
      console.error(error);
      setLegalAlert({ type: "error", message: "Failed to update legal status." });
    } finally {
      setIsSavingLegal(false);
    }
  };

  // Perform coordinates geofence validation for warning box (memoized)
  const validationResult = useMemo(() => {
    if (!selectedPropertyForCommunity || !selectedCommunityId) return null;
    const { latitude, longitude } = selectedPropertyForCommunity;
    if (latitude === null || longitude === null) {
      return {
        status: "no_coords" as const,
        message: "Property does not have location coordinates. Geofence validation skipped.",
      };
    }

    const selectedComm = communities.find((c) => c.id === selectedCommunityId);
    if (!selectedComm || !selectedComm.geoFenceCoords?.coordinates?.[0]) {
      return {
        status: "no_geofence" as const,
        message:
          "Selected community does not have a geo-fence defined. Geofence validation skipped.",
      };
    }

    const polygon = selectedComm.geoFenceCoords.coordinates[0];
    const isInside = isPointInPolygon([longitude, latitude], polygon);

    if (isInside) {
      return {
        status: "inside" as const,
        message:
          "Coordinates validated: The listing is successfully inside the community geofence.",
      };
    } else {
      return {
        status: "outside" as const,
        message:
          "Warning: The property's coordinates are outside the selected community's geo-fence boundary. Association is permitted but not recommended.",
      };
    }
  }, [selectedPropertyForCommunity, selectedCommunityId, communities]);

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
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table data-testid="listings-tags-table" className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4 w-20">{t("tableThumbnail")}</th>
                <th className="px-6 py-4">{t("tableTitle")}</th>
                <th className="px-6 py-4 w-32">{t("tableRef")}</th>
                <th className="px-6 py-4 w-32">{t("tablePrice")}</th>
                <th className="px-6 py-4">{t("tableTags")}</th>
                <th className="px-6 py-4 text-right w-[280px]">{t("tableActions")}</th>
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

                  const associatedCommunity = communities.find(
                    (c) => c.id === property.communityId,
                  );

                  return (
                    <tr
                      key={property.id}
                      data-testid="listing-tags-row"
                      className="hover:bg-slate-800/40 transition-colors property-row"
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
                          <span className="font-bold text-slate-100 property-title">{title}</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {associatedCommunity && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 max-w-max px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                                🏔️ {associatedCommunity.name}
                              </span>
                            )}
                            {property.zmtStatus &&
                              property.zmtStatus !== "titled" &&
                              property.zmtStatus !== "none" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 max-w-max px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                                  📜{" "}
                                  {property.zmtStatus === "concession"
                                    ? "Concession"
                                    : "ZMT Restricted"}
                                </span>
                              )}
                          </div>
                        </div>
                      </td>
                      <td
                        data-testid="listing-ref-code"
                        className="px-6 py-4 font-mono font-bold text-slate-400 property-ref"
                      >
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
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenLegalModal(property)}
                            data-testid="manage-legal-btn"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 rounded-lg transition-all cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                            <span>Legal</span>
                          </button>
                          <button
                            onClick={() => handleOpenCommunityModal(property)}
                            data-testid="manage-community-btn"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 rounded-lg transition-all cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5 text-amber-500" />
                            <span>Community</span>
                          </button>
                          <button
                            onClick={() => handleOpenModal(property)}
                            data-testid="manage-tags-btn"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer manage-tags-btn"
                          >
                            <Tags className="w-3.5 h-3.5" />
                            <span>{t("btnManageTags")}</span>
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

      {/* Community Management Modal */}
      {selectedPropertyForCommunity && (
        <div
          data-testid="manage-community-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
            {/* Close button */}
            <button
              onClick={handleCloseCommunityModal}
              className="absolute right-4 top-4 p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div>
              <h2 className="text-xl font-bold text-white pr-8">Associate Community</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-semibold">
                Manually link &quot;
                {locale === "es"
                  ? selectedPropertyForCommunity.titleEs
                  : selectedPropertyForCommunity.titleEn}
                &quot; to a curated community development.
              </p>
            </div>

            {/* Alert Message */}
            {communityAlert && (
              <div
                className={`p-3.5 rounded-lg border text-sm font-medium ${
                  communityAlert.type === "success"
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                {communityAlert.message}
              </div>
            )}

            {/* Dropdown Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Select Community
              </label>
              <select
                value={selectedCommunityId}
                onChange={(e) => setSelectedCommunityId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-semibold"
                data-testid="community-select"
              >
                <option value="">None (Decouple property)</option>
                {communities.map((comm) => (
                  <option key={comm.id} value={comm.id}>
                    {comm.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Geofence Validation Warning Box */}
            {validationResult && (
              <div
                data-testid="geofence-alert"
                className={`p-4 rounded-lg border text-xs font-semibold flex gap-3 items-start ${
                  validationResult.status === "inside"
                    ? "bg-green-500/5 text-green-400 border-green-500/15"
                    : validationResult.status === "outside"
                      ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-lg shadow-red-950/20"
                      : "bg-slate-950/50 text-slate-400 border-slate-800"
                }`}
              >
                {validationResult.status === "inside" ? (
                  <MapPin className="w-5 h-5 flex-shrink-0 text-green-400" />
                ) : validationResult.status === "outside" ? (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 animate-pulse" />
                ) : (
                  <HelpCircle className="w-5 h-5 flex-shrink-0 text-slate-500" />
                )}
                <div className="space-y-1">
                  <span className="block font-bold">
                    {validationResult.status === "inside"
                      ? "Geofence Match Success"
                      : validationResult.status === "outside"
                        ? "Geofence Boundary Warning"
                        : "Geofence Check"}
                  </span>
                  <p className="leading-relaxed text-[11px] font-medium text-slate-300">
                    {validationResult.message}
                  </p>
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCloseCommunityModal}
                disabled={isSavingCommunity}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-all rounded-lg hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCommunity}
                disabled={isSavingCommunity}
                data-testid="save-community-btn"
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-all focus:ring-2 focus:ring-red-500 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {isSavingCommunity && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSavingCommunity ? "Saving..." : "Save Association"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tags Modal */}
      {selectedProperty && (
        <div
          data-testid="manage-tags-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm tags-modal"
        >
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
                {t("modalTitle", {
                  title: locale === "es" ? selectedProperty.titleEs : selectedProperty.titleEn,
                })}
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

      {/* Legal Status Modal */}
      {selectedPropertyForLegal && (
        <div
          data-testid="manage-legal-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
            {/* Close button */}
            <button
              onClick={handleCloseLegalModal}
              className="absolute right-4 top-4 p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div>
              <h2 className="text-xl font-bold text-white pr-8">Legal Status</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-semibold">
                Set the property legal status for &quot;
                {locale === "es"
                  ? selectedPropertyForLegal.titleEs
                  : selectedPropertyForLegal.titleEn}
                &quot;.
              </p>
            </div>

            {/* Alert Message */}
            {legalAlert && (
              <div
                className={`p-3.5 rounded-lg border text-sm font-medium ${
                  legalAlert.type === "success"
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                {legalAlert.message}
              </div>
            )}

            {/* Dropdown Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Select Legal Status
              </label>
              <select
                value={selectedZmtStatus}
                onChange={(e) => setSelectedZmtStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                data-testid="legal-select"
              >
                <option value="none">Not Specified (Hidden)</option>
                <option value="titled">Titled Property (Hidden)</option>
                <option value="concession">Concession (Visible Badge)</option>
                <option value="zmt_restricted">ZMT Restricted (Visible Badge)</option>
              </select>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCloseLegalModal}
                disabled={isSavingLegal}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-all rounded-lg hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLegal}
                disabled={isSavingLegal}
                data-testid="save-legal-btn"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-all focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {isSavingLegal && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSavingLegal ? "Saving..." : "Save Legal Status"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
